import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function removeMikroTikUser(voucherCode: string): Promise<boolean> {
  const apiUrl = Deno.env.get('MIKROTIK_API_URL');
  const username = Deno.env.get('MIKROTIK_USERNAME');
  const password = Deno.env.get('MIKROTIK_PASSWORD');

  if (!apiUrl || !username || !password) return false;

  try {
    // Find the user by name
    const findResp = await fetch(`${apiUrl}/rest/ip/hotspot/user?name=${encodeURIComponent(voucherCode)}`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Accept': 'application/json',
      },
    });

    if (!findResp.ok) return false;
    const users = await findResp.json();
    if (!Array.isArray(users) || users.length === 0) return false;

    const userId = users[0]['.id'];

    // Remove the user
    const removeResp = await fetch(`${apiUrl}/rest/ip/hotspot/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      },
    });

    // Also kick any active session
    try {
      const activeResp = await fetch(`${apiUrl}/rest/ip/hotspot/active?user=${encodeURIComponent(voucherCode)}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
          'Accept': 'application/json',
        },
      });
      if (activeResp.ok) {
        const sessions = await activeResp.json();
        for (const session of (Array.isArray(sessions) ? sessions : [])) {
          await fetch(`${apiUrl}/rest/ip/hotspot/active/${session['.id']}`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Basic ' + btoa(`${username}:${password}`),
            },
          });
        }
      }
    } catch (e) {
      console.error('Failed to kick active session:', e);
    }

    console.log(`Removed MikroTik user: ${voucherCode} (${removeResp.ok ? 'success' : 'failed'})`);
    return removeResp.ok;
  } catch (err) {
    console.error(`Error removing MikroTik user ${voucherCode}:`, err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find all active vouchers that have expired
    const now = new Date().toISOString();
    const { data: expiredVouchers, error } = await supabase
      .from('vouchers')
      .select('id, code, expires_at')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (error) throw error;

    let cleaned = 0;
    let mikrotikRemoved = 0;

    for (const v of (expiredVouchers || [])) {
      // Mark as expired in DB
      await supabase
        .from('vouchers')
        .update({ status: 'expired' })
        .eq('id', v.id);

      // Remove from MikroTik router
      const removed = await removeMikroTikUser(v.code);
      if (removed) mikrotikRemoved++;
      cleaned++;
    }

    console.log(`Cleanup: ${cleaned} vouchers expired, ${mikrotikRemoved} MikroTik users removed`);

    return new Response(JSON.stringify({
      cleaned,
      mikrotikRemoved,
      timestamp: now,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
