import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Wifi, Users, TrendingUp, Clock, CheckCircle,
  AlertCircle, Settings, RefreshCw, LogOut, Eye, EyeOff,
  Printer, Plus, Package, ChevronDown, ChevronUp, Download, BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  phone: string;
  amount_kes: number;
  payment_method: string;
  status: string;
  created_at: string;
  wifi_packages: { name: string; duration_label: string } | null;
}

interface Voucher {
  id: string;
  code: string;
  status: string;
  valid_hours: number;
  created_at: string;
  expires_at: string;
  wifi_packages: { name: string } | null;
}

interface WifiPackage {
  id: string;
  name: string;
  duration_label: string;
  duration_hours: number;
  price_kes: number;
}

const ADMIN_PASS = "sonic2024";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passErr, setPassErr] = useState("");
  const [tab, setTab] = useState<"overview" | "orders" | "vouchers" | "bulk" | "guide">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<WifiPackage[]>([]);
  const [loading, setLoading] = useState(false);

  // Bulk voucher state
  const [bulkPkg, setBulkPkg] = useState("");
  const [bulkQty, setBulkQty] = useState(10);
  const [bulkGenerated, setBulkGenerated] = useState<{ code: string; pkg: string; duration: string; expires_at: string }[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const login = () => {
    if (pass === ADMIN_PASS) { setAuthed(true); loadData(); }
    else setPassErr("Incorrect password");
  };

  const loadData = async () => {
    setLoading(true);
    const [{ data: ordersData }, { data: vouchersData }, { data: pkgsData }] = await Promise.all([
      supabase.from("orders").select("*, wifi_packages(name, duration_label)").order("created_at", { ascending: false }).limit(100),
      supabase.from("vouchers").select("*, wifi_packages(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("wifi_packages").select("*").eq("is_active", true).order("price_kes"),
    ]);
    if (ordersData) setOrders(ordersData as Order[]);
    if (vouchersData) setVouchers(vouchersData as Voucher[]);
    if (pkgsData) { setPackages(pkgsData as WifiPackage[]); if (pkgsData.length > 0) setBulkPkg(pkgsData[0].id); }
    setLoading(false);
  };

  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.amount_kes, 0);
  const activeVouchers = vouchers.filter(v => v.status === "active").length;

  // Generate bulk vouchers using DB function
  const generateBulk = async () => {
    if (!bulkPkg) return;
    setBulkLoading(true);
    const pkg = packages.find(p => p.id === bulkPkg);
    if (!pkg) { setBulkLoading(false); return; }

    const generated: { code: string; pkg: string; duration: string; expires_at: string }[] = [];

    for (let i = 0; i < bulkQty; i++) {
      const expiresAt = new Date(Date.now() + pkg.duration_hours * 3600 * 1000).toISOString();
      const { data: codeData } = await supabase.rpc("generate_voucher_code");
      const code = codeData || `BULK-${Date.now()}-${i}`;

      const { data: voucher } = await supabase.from("vouchers").insert({
        code,
        package_id: bulkPkg,
        valid_hours: pkg.duration_hours,
        expires_at: expiresAt,
        status: "active",
      }).select().single();

      if (voucher) {
        generated.push({ code: voucher.code, pkg: pkg.name, duration: pkg.duration_label, expires_at: voucher.expires_at });
      }
    }

    setBulkGenerated(generated);
    setBulkLoading(false);
    loadData();
  };

  const printVouchers = () => {
    const printContent = `
      <html><head><title>Wi-Fi Vouchers</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #fff; color: #000; }
        h1 { font-size: 18px; margin-bottom: 20px; text-align: center; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { border: 2px dashed #333; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; }
        .logo { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
        .code { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 8px 0; color: #0077cc; }
        .pkg { font-size: 11px; color: #555; }
        .price { font-size: 13px; font-weight: bold; margin-top: 4px; }
        .cut { border-top: 1px dashed #aaa; margin-top: 8px; padding-top: 4px; font-size: 10px; color: #888; }
        @media print { body { padding: 10px; } }
      </style></head>
      <body>
        <h1>🌐 Kabejja Net Wi-Fi Vouchers — ${new Date().toLocaleDateString()}</h1>
        <div class="grid">
          ${bulkGenerated.map(v => `
            <div class="card">
              <div class="logo">📶 KABEJJA NET</div>
              <div class="pkg">${v.pkg} · ${v.duration}</div>
              <div class="code">${v.code}</div>
              <div class="cut">─────────────────</div>
              <div style="font-size:10px;color:#888;">Expires: ${new Date(v.expires_at).toLocaleDateString()}</div>
            </div>
          `).join("")}
        </div>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-sonic rounded-2xl w-full max-w-sm p-8">
          <div className="h-1 bg-gradient-to-r from-electric via-neon to-fire mb-8 -mx-8 -mt-8 rounded-t-2xl" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-electric/20 border border-electric/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-electric" />
            </div>
            <div>
              <h2 className="font-heading text-xl text-foreground">Admin Login</h2>
              <p className="text-xs text-muted-foreground">Kabejja Net Management</p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter admin password"
                value={pass}
                onChange={e => { setPass(e.target.value); setPassErr(""); }}
                onKeyDown={e => e.key === "Enter" && login()}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors pr-10"
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-electric transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passErr && <p className="text-destructive text-xs mt-1">{passErr}</p>}
          </div>
          <button onClick={login} className="btn-electric w-full py-3 rounded-xl font-heading text-lg">LOGIN →</button>
          <a href="/" className="block text-center text-xs text-muted-foreground mt-4 hover:text-electric transition-colors">← Back to portal</a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "vouchers", label: "Vouchers" },
    { id: "bulk", label: "Bulk Generate" },
    { id: "guide", label: "MikroTik Guide" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-electric" />
          <span className="font-display text-xl gradient-text-electric">KABEJJA NET</span>
          <span className="text-muted-foreground text-xs border border-border rounded px-2 py-0.5 ml-1">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading} className="p-2 rounded-lg border border-border hover:border-electric/40 text-muted-foreground hover:text-electric transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setAuthed(false)} className="p-2 rounded-lg border border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: orders.length, icon: Package, color: "electric" },
            { label: "Completed", value: completedOrders.length, icon: CheckCircle, color: "electric" },
            { label: "Revenue (UGX)", value: `${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "fire" },
            { label: "Active Vouchers", value: activeVouchers, icon: Wifi, color: "fire" },
          ].map(s => (
            <div key={s.label} className="card-sonic rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color === "fire" ? "bg-fire/20 border border-fire/30" : "bg-electric/20 border border-electric/30"}`}>
                <s.icon className={`w-4 h-4 ${s.color === "fire" ? "text-fire" : "text-electric"}`} />
              </div>
              <p className={`font-display text-2xl mb-0.5 ${s.color === "fire" ? "gradient-text-fire" : "gradient-text-electric"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wide border-b-2 transition-all -mb-px whitespace-nowrap ${tab === t.id ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-sonic rounded-xl p-5">
              <h3 className="font-heading text-lg text-foreground mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 6).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-foreground font-medium">{o.phone}</p>
                      <p className="text-xs text-muted-foreground">{o.wifi_packages?.name} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-electric font-semibold">UGX {o.amount_kes.toLocaleString()}</p>
                      <span className={`text-xs font-bold ${o.status === "completed" ? "text-electric" : o.status === "failed" ? "text-destructive" : "text-secondary"}`}>
                        {o.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet</p>}
              </div>
            </div>
            <div className="card-sonic rounded-xl p-5">
              <h3 className="font-heading text-lg text-foreground mb-4">Active Vouchers</h3>
              <div className="space-y-3">
                {vouchers.filter(v => v.status === "active").slice(0, 6).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-mono text-electric text-xs">{v.code}</p>
                      <p className="text-xs text-muted-foreground">{v.wifi_packages?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Expires</p>
                      <p className="text-xs text-foreground">{v.expires_at ? new Date(v.expires_at).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                ))}
                {activeVouchers === 0 && <p className="text-muted-foreground text-sm">No active vouchers</p>}
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {tab === "orders" && (
          <div className="card-sonic rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Phone", "Package", "Amount (UGX)", "Method", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">{o.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.wifi_packages?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-electric">UGX {o.amount_kes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground uppercase">{o.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${o.status === "completed" ? "bg-electric/20 text-electric" : o.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
            </div>
          </div>
        )}

        {/* Vouchers Table */}
        {tab === "vouchers" && (
          <div className="card-sonic rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Code", "Package", "Status", "Valid For", "Expires", "Created"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vouchers.map(v => (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-electric">{v.code}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.wifi_packages?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${v.status === "active" ? "bg-electric/20 text-electric" : v.status === "used" ? "bg-muted text-muted-foreground" : "bg-destructive/20 text-destructive"}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.valid_hours}h</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{v.expires_at ? new Date(v.expires_at).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vouchers.length === 0 && <p className="text-center text-muted-foreground py-8">No vouchers yet</p>}
            </div>
          </div>
        )}

        {/* Bulk Generate */}
        {tab === "bulk" && (
          <div className="space-y-4">
            <div className="card-sonic rounded-xl p-6">
              <h3 className="font-heading text-xl text-foreground mb-1">Bulk Voucher Generator</h3>
              <p className="text-sm text-muted-foreground mb-5">Generate multiple vouchers at once and print them for physical distribution.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Package</label>
                  <select
                    value={bulkPkg}
                    onChange={e => setBulkPkg(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric transition-colors"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.duration_label} (UGX {p.price_kes.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quantity (max 100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkQty}
                    onChange={e => setBulkQty(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={generateBulk}
                disabled={bulkLoading || !bulkPkg}
                className="btn-electric px-6 py-3 rounded-xl font-heading flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {bulkLoading ? `Generating... (${bulkGenerated.length}/${bulkQty})` : `Generate ${bulkQty} Vouchers`}
              </button>
            </div>

            {bulkGenerated.length > 0 && (
              <div className="card-sonic rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg text-foreground">{bulkGenerated.length} Vouchers Generated</h3>
                  <button
                    onClick={printVouchers}
                    className="btn-fire px-4 py-2 rounded-xl font-heading text-sm flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {bulkGenerated.map((v, i) => (
                    <div key={i} className="bg-muted/20 border border-border rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{v.pkg} · {v.duration}</p>
                      <p className="font-mono text-electric font-bold text-sm">{v.code}</p>
                      <p className="text-xs text-muted-foreground mt-1">Exp: {new Date(v.expires_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MikroTik Guide */}
        {tab === "guide" && <MikroTikGuide />}
      </div>
    </div>
  );
};

// ─── MikroTik Configuration Guide ───────────────────────────────────────────

const steps = [
  {
    title: "1. Basic MikroTik Hotspot Setup",
    content: [
      "Open Winbox and connect to your MikroTik router",
      "Go to IP → Hotspot → Setup Wizard",
      "Select the interface connected to the wireless/LAN side (e.g. bridge-local)",
      "Set the IP pool for hotspot users (e.g. 192.168.88.10–192.168.88.254)",
      "Set DNS name: hotspot.kabejjanet.com (or leave as IP)",
      "Create an admin user when prompted",
    ]
  },
  {
    title: "2. Configure Walled Garden (Allow Payment Page)",
    content: [
      "Go to IP → Hotspot → Walled Garden",
      "Add your payment portal domain: Add the domain of this app (from the URL bar)",
      "Also add: supabase.co, pesapal.com, *.pesapal.com",
      "This allows users to load the payment page BEFORE authenticating",
      "Example entry: Dst. Host = *.pesapal.com, Action = allow",
    ]
  },
  {
    title: "3. Set Captive Portal (Login Page) URL",
    content: [
      "Go to IP → Hotspot → Server Profiles → Select your profile",
      "Set 'Login Page' to your portal URL (e.g. https://your-app.lovable.app)",
      "OR keep the MikroTik default login page and link it to your portal",
      "Set 'Rate Limit' to match your packages (e.g. 10M/10M for basic)",
      "Enable HTTPS if you have an SSL certificate",
    ]
  },
  {
    title: "4. Create User Profiles per Package",
    content: [
      "Go to IP → Hotspot → User Profiles",
      "Create profile 'daily' → Rate limit: 10M/10M, Session Timeout: 1d",
      "Create profile 'weekly' → Rate limit: 20M/20M, Session Timeout: 7d",
      "Create profile 'monthly' → Rate limit: 50M/50M, Session Timeout: 30d",
      "Set Shared Users to 3/5/10 matching your packages",
    ]
  },
  {
    title: "5. Auto-Login Users with Voucher Code",
    content: [
      "When a user gets a voucher, add them as a hotspot user via the API or manually",
      "Go to IP → Hotspot → Users → Add",
      "Username = Voucher Code (e.g. ABCD-EFGH-1234)",
      "Password = same as voucher code (or blank)",
      "Profile = select the matching profile (daily/weekly/monthly)",
      "Limit Uptime = 1d/7d/30d",
      "User connects to Wi-Fi → browser opens login page → enters voucher code → connected!",
    ]
  },
  {
    title: "6. Automated via MikroTik API (Advanced)",
    content: [
      "Install RouterOS API library on your server",
      "When Pesapal confirms payment → call MikroTik API to create hotspot user automatically",
      "API port is 8728 (or 8729 for SSL) on your router",
      "Command: /ip/hotspot/user/add name=<voucher> password=<voucher> profile=<plan> limit-uptime=<duration>",
      "This fully automates the process — no manual user creation needed",
      "For security: create a separate API user with limited permissions",
    ]
  },
  {
    title: "7. Auto-Connect After Payment",
    content: [
      "After the user gets their voucher code, the portal redirects them to the MikroTik login page",
      "If using the default MikroTik login page: http://192.168.88.1/login",
      "The redirect URL can auto-fill the username/password: http://192.168.88.1/login?username=VOUCHER&password=VOUCHER",
      "This gives users a 1-click connection experience",
      "Set this URL in the PaymentCallback page's 'Connect Now' button",
    ]
  },
  {
    title: "8. Redirect URL for Auto-Connect",
    content: [
      "After successful payment, user should be redirected to:",
      "http://<router-ip>/login?username=<voucher-code>&password=<voucher-code>",
      "Example: http://192.168.88.1/login?username=ABCD-EFGH-1234&password=ABCD-EFGH-1234",
      "Set your router's IP in the portal settings (default: 192.168.88.1)",
      "Test this URL manually first to confirm auto-login works on your firmware version",
    ]
  },
];

const MikroTikGuide = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <div className="card-sonic rounded-xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-electric" />
          <h3 className="font-heading text-xl text-foreground">MikroTik Hotspot Configuration Guide</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Step-by-step guide to configure your MikroTik router to work with this captive portal system.
          This covers hotspot setup, walled garden, voucher-based authentication, and auto-connect after payment.
        </p>
      </div>

      {steps.map((step, i) => (
        <div key={i} className="card-sonic rounded-xl overflow-hidden">
          <button
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-heading text-base text-foreground">{step.title}</span>
            {open === i ? <ChevronUp className="w-4 h-4 text-electric flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-border/50">
              <ul className="space-y-2 mt-3">
                {step.content.map((line, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-electric/20 border border-electric/30 text-electric text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{j + 1}</span>
                    <span className="text-muted-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <div className="bg-fire/10 border border-fire/30 rounded-xl p-4">
        <p className="text-sm font-semibold text-fire mb-1">⚠️ Important Notes</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Always test with a small amount first before going live</li>
          <li>• Make sure your router has a stable internet connection on the WAN port</li>
          <li>• The router IP 192.168.88.1 is the default — yours may be different</li>
          <li>• For production, use HTTPS on your portal to protect payment data</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;
