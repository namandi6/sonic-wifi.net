import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Wifi, Users, TrendingUp, BarChart3, Clock, CheckCircle,
  AlertCircle, Settings, RefreshCw, Package, LogOut, Eye, EyeOff
} from "lucide-react";

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

const ADMIN_PASS = "sonic2024"; // simple password

const AdminPanel = () => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passErr, setPassErr] = useState("");
  const [tab, setTab] = useState<"overview" | "orders" | "vouchers">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (pass === ADMIN_PASS) { setAuthed(true); loadData(); }
    else setPassErr("Incorrect password");
  };

  const loadData = async () => {
    setLoading(true);
    const [{ data: ordersData }, { data: vouchersData }] = await Promise.all([
      supabase.from("orders").select("*, wifi_packages(name, duration_label)").order("created_at", { ascending: false }).limit(100),
      supabase.from("vouchers").select("*, wifi_packages(name)").order("created_at", { ascending: false }).limit(100),
    ]);
    if (ordersData) setOrders(ordersData as Order[]);
    if (vouchersData) setVouchers(vouchersData as Voucher[]);
    setLoading(false);
  };

  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.amount_kes, 0);
  const activeVouchers = vouchers.filter(v => v.status === "active").length;

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
              <p className="text-xs text-muted-foreground">Sonic Wi-Fi Management</p>
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
          <button onClick={login} className="btn-electric w-full py-3 rounded-xl font-heading text-lg">
            LOGIN →
          </button>
          <a href="/" className="block text-center text-xs text-muted-foreground mt-4 hover:text-electric transition-colors">← Back to portal</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-electric" />
          <span className="font-display text-xl gradient-text-electric">SONIC WI-FI</span>
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
            { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "fire" },
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
        <div className="flex gap-1 border-b border-border">
          {(["overview", "orders", "vouchers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 font-heading text-sm uppercase tracking-wide border-b-2 transition-all -mb-px capitalize ${tab === t ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-sonic rounded-xl p-5">
              <h3 className="font-heading text-lg text-foreground mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium">{o.phone}</p>
                      <p className="text-xs text-muted-foreground">{o.wifi_packages?.name} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-electric font-semibold">KES {o.amount_kes}</p>
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
                {vouchers.filter(v => v.status === "active").slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-mono text-electric">{v.code}</p>
                      <p className="text-xs text-muted-foreground">{v.wifi_packages?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Expires</p>
                      <p className="text-xs text-foreground">{new Date(v.expires_at).toLocaleDateString()}</p>
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
                    {["Phone", "Package", "Amount", "Method", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">{o.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.wifi_packages?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-electric">KES {o.amount_kes}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground uppercase">{o.payment_method}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {o.status === "completed" ? <CheckCircle className="w-3 h-3 text-electric" /> : <AlertCircle className="w-3 h-3 text-muted-foreground" />}
                          <span className={`text-xs font-bold uppercase ${o.status === "completed" ? "text-electric" : o.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{o.status}</span>
                        </div>
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
      </div>
    </div>
  );
};

export default AdminPanel;
