import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PESAPAL_BASE = 'https://pay.pesapal.com/v3'; // production

async function getPesapalToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;
  const resp = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  const data = await resp.json();
  if (!data.token) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId') || url.searchParams.get('orderTrackingId');
    const orderMerchantRef = url.searchParams.get('OrderMerchantReference') || url.searchParams.get('orderMerchantReference');

    console.log('IPN received:', { orderTrackingId, orderMerchantRef });

    if (!orderTrackingId) {
      return new Response(JSON.stringify({ error: 'Missing OrderTrackingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get transaction status from Pesapal
    const token = await getPesapalToken();
    const statusResp = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );
    const statusData = await statusResp.json();
    console.log('Transaction status:', statusData);

    const paymentStatus = statusData.payment_status_description || statusData.status;
    const isCompleted = paymentStatus?.toLowerCase() === 'completed';

    // Find the order
    const { data: order } = await supabase
      .from('orders')
      .select('*, wifi_packages(*)')
      .eq('id', orderMerchantRef)
      .single();

    if (!order) {
      console.log('Order not found for ref:', orderMerchantRef);
      return new Response('OK', { headers: corsHeaders });
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: isCompleted ? 'completed' : paymentStatus?.toLowerCase() === 'failed' ? 'failed' : 'pending',
        pesapal_tracking_id: orderTrackingId,
      })
      .eq('id', orderMerchantRef);

    // If completed, generate voucher
    if (isCompleted) {
      // Check if voucher already exists
      const { data: existingVoucher } = await supabase
        .from('vouchers')
        .select('id')
        .eq('order_id', order.id)
        .single();

      if (!existingVoucher) {
        const code = generateVoucherCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (order.wifi_packages?.duration_hours || 24));

        await supabase.from('vouchers').insert({
          order_id: order.id,
          package_id: order.package_id,
          code,
          status: 'active',
          valid_hours: order.wifi_packages?.duration_hours || 24,
          expires_at: expiresAt.toISOString(),
        });

        console.log('Voucher created:', code);
      }
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (err) {
    console.error('IPN error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
