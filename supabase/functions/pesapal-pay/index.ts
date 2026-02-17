import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PESAPAL_BASE = 'https://pay.pesapal.com/v3'; // production
// const PESAPAL_BASE = 'https://cybqa.pesapal.com/pesapalv3'; // sandbox

async function getPesapalToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;

  const resp = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });

  const data = await resp.json();
  if (!data.token) throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

async function registerIPN(token: string, ipnUrl: string): Promise<string> {
  const resp = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'GET',
    }),
  });
  const data = await resp.json();
  return data.ipn_id || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, packageName, amount, phone, email, callbackUrl, ipnUrl, currency } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Pesapal token
    const token = await getPesapalToken();

    // Register IPN
    const ipnId = await registerIPN(token, ipnUrl);

    // Submit order
    const orderResp = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: orderId,
        currency: currency || 'UGX',
        amount: amount,
        description: `Sonic Net Wi-Fi - ${packageName}`,
        callback_url: callbackUrl,
        redirect_mode: '',
        notification_id: ipnId,
        branch: 'Sonic Net',
        billing_address: {
          phone_number: phone,
          email_address: email || '',
          first_name: 'Customer',
          last_name: '',
        },
      }),
    });

    const orderData = await orderResp.json();
    
    if (!orderData.redirect_url) {
      throw new Error(`Pesapal order failed: ${JSON.stringify(orderData)}`);
    }

    // Update order with Pesapal tracking
    await supabase
      .from('orders')
      .update({ pesapal_order_id: orderData.order_tracking_id })
      .eq('id', orderId);

    return new Response(JSON.stringify({
      redirect_url: orderData.redirect_url,
      order_tracking_id: orderData.order_tracking_id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('pesapal-pay error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
