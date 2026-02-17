import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PESAPAL_BASE = 'https://pay.pesapal.com/v3';

async function getPesapalToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;
  const resp = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  const data = await resp.json();
  if (!data.token) throw new Error(`Auth failed`);
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
    const { orderId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get order from DB
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, wifi_packages(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if voucher already exists
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (voucher) {
      return new Response(JSON.stringify({ status: 'completed', voucher }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If order has Pesapal tracking ID, check status
    if (order.pesapal_order_id) {
      const token = await getPesapalToken();
      const statusResp = await fetch(
        `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${order.pesapal_order_id}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
      );
      const statusData = await statusResp.json();
      const paymentStatus = statusData.payment_status_description?.toLowerCase() || '';
      const isCompleted = paymentStatus === 'completed';

      if (isCompleted) {
        // Update order & create voucher
        await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);

        const code = generateVoucherCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (order.wifi_packages?.duration_hours || 24));

        const { data: newVoucher } = await supabase
          .from('vouchers')
          .insert({
            order_id: order.id,
            package_id: order.package_id,
            code,
            status: 'active',
            valid_hours: order.wifi_packages?.duration_hours || 24,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        return new Response(JSON.stringify({ status: 'completed', voucher: newVoucher }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ status: paymentStatus || order.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: order.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('status error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
