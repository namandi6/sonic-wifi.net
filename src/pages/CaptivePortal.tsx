import { useState, useEffect } from "react";
import { Wifi, Clock, Users, ChevronRight, Phone, Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VoucherDisplay from "@/components/VoucherDisplay";
import sonicBg from "@/assets/sonic-bg.jpeg";

interface Package {
  id: string;
  name: string;
  duration_label: string;
  duration_hours: number;
  price_kes: number;
  speed_mbps: number;
  max_devices: number;
  is_popular: boolean;
}

type Step = "packages" | "payment" | "processing";

const CaptivePortal = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState<Package | null>(null);
  const [step, setStep] = useState<Step>("packages");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"mpesa" | "airtel" | "card">("mpesa");
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState<{ code: string; expires_at: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("wifi_packages").select("*").eq("is_active", true).order("price_kes").then(({ data }) => {
      if (data) setPackages(data);
    });
  }, []);

  const handleBuy = async () => {
    if (!phone || !selected) return;
    setLoading(true);
    setError("");

    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          package_id: selected.id,
          phone,
          amount_kes: selected.price_kes,
          payment_method: method,
        })
        .select()
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message || "Failed to create order");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
      const appUrl = window.location.origin;

      const resp = await fetch(`${baseUrl}/pesapal-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          packageName: selected.name,
          amount: selected.price_kes,
          phone,
          email,
          callbackUrl: `${appUrl}/payment/callback?orderId=${order.id}`,
          ipnUrl: `${baseUrl}/pesapal-ipn`,
          currency: "UGX",
        }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      window.location.href = data.redirect_url;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  if (voucher && selected) {
    return (
      <VoucherDisplay
        voucher={voucher.code}
        expiresAt={voucher.expires_at}
        pkg={selected}
        onClose={() => { setVoucher(null); setStep("packages"); setSelected(null); }}
      />
    );
  }

  const packageIcons = ["⚡", "🚀", "🌙"];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Full-page background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${sonicBg})` }} />
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />

      {/* Hero Header */}
      <div className="relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        <div className="relative z-10 text-center py-12 px-4">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-electric/10 border-2 border-electric/40 mb-4 wifi-pulse mx-auto">
            <Wifi className="w-10 h-10 text-electric" />
          </div>
          <h1 className="font-display text-6xl gradient-text-electric mb-1">SONIC NET</h1>
          <p className="text-muted-foreground font-heading text-base tracking-wide">Ultra-Fast Wi-Fi · Pay & Connect Instantly</p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className="bg-secondary/20 border border-secondary/30 text-secondary px-3 py-1 rounded-full text-xs font-bold">MTN MOMO</span>
            <span className="bg-destructive/20 border border-destructive/30 text-destructive px-3 py-1 rounded-full text-xs font-bold">AIRTEL MONEY</span>
            <span className="bg-electric/20 border border-electric/30 text-electric px-3 py-1 rounded-full text-xs font-bold">VISA/CARD</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-4 pb-10 max-w-lg mx-auto w-full">

        {step === "packages" && (
          <div className="space-y-3">
            <p className="font-heading text-sm text-muted-foreground uppercase tracking-widest mb-5 text-center">Select Your Plan</p>
            {packages.map((pkg, i) => (
              <button
                key={pkg.id}
                onClick={() => { setSelected(pkg); setStep("payment"); }}
                className={`w-full rounded-2xl p-5 text-left flex items-center gap-4 transition-all border group ${
                  pkg.is_popular
                    ? "bg-gradient-to-r from-fire/10 to-fire/5 border-fire/50 hover:border-fire hover:shadow-lg"
                    : "card-sonic hover:border-electric/50"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${
                  pkg.is_popular ? "bg-fire/20 border border-fire/40" : "bg-electric/10 border border-electric/30"
                }`}>
                  {packageIcons[i % 3]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-2xl text-foreground">{pkg.name}</span>
                    {pkg.is_popular && (
                      <span className="bg-fire text-white text-xs font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>
                    )}
                  </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration_label}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pkg.max_devices} device{pkg.max_devices > 1 ? "s" : ""}</span>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-display text-3xl ${pkg.is_popular ? "gradient-text-fire" : "gradient-text-electric"}`}>
                    {pkg.price_kes.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold">UGX</div>
                  <ChevronRight className={`w-5 h-5 mt-1 ml-auto transition-transform group-hover:translate-x-1 ${pkg.is_popular ? "text-fire" : "text-electric"}`} />
                </div>
              </button>
            ))}

            {/* Info strip */}
            <div className="mt-6 bg-muted/20 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-electric flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Secure & Instant</p>
                <p className="text-xs text-muted-foreground">Voucher delivered immediately after payment. Works on all devices.</p>
              </div>
            </div>
          </div>
        )}

        {step === "payment" && selected && (
          <div className="slide-up">
            <button
              onClick={() => setStep("packages")}
              className="text-muted-foreground hover:text-electric transition-colors text-sm font-heading mb-5 flex items-center gap-1"
            >
              ← Back
            </button>

            {/* Order Summary */}
            <div className="rounded-2xl p-5 mb-5 bg-gradient-to-br from-card to-muted/30 border border-electric/20">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Order Summary</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-3xl text-foreground">{selected.name} Plan</p>
                  <p className="text-sm text-muted-foreground mt-1">{selected.duration_label} · {selected.max_devices} device{selected.max_devices > 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-4xl gradient-text-fire">{selected.price_kes.toLocaleString()}</span>
                  <p className="text-xs text-muted-foreground font-bold">UGX</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "mpesa" as const, label: "MTN MoMo", emoji: "🟡" },
                  { id: "airtel" as const, label: "Airtel Money", emoji: "🔴" },
                  { id: "card" as const, label: "Card", emoji: "💳" },
                ] as { id: "mpesa" | "airtel" | "card"; label: string; emoji: string }[]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`py-3 px-2 rounded-xl text-xs font-heading border transition-all flex flex-col items-center gap-1 ${
                      method === m.id
                        ? "border-electric bg-electric/10 text-electric"
                        : "border-border text-muted-foreground hover:border-electric/40"
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone / Email */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {method === "card" ? "Email Address" : "Phone Number"}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-electric">
                  {method === "card" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type={method === "card" ? "email" : "tel"}
                  placeholder={method === "card" ? "your@email.com" : "0712 345 678"}
                  value={method === "card" ? email : phone}
                  onChange={(e) => method === "card" ? setEmail(e.target.value) : setPhone(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors text-sm"
                />
              </div>
            </div>

            {method !== "card" && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Email (Optional — for receipt)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="email"
                    placeholder="receipt@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4 text-destructive text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={loading || (!phone && !email)}
              className="btn-fire w-full py-4 rounded-2xl font-heading text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "⏳ Redirecting to Pesapal..." : `PAY UGX ${selected.price_kes.toLocaleString()} →`}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secured by Pesapal · Regulated by Bank of Uganda
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-border py-4 text-center text-xs text-muted-foreground">
        Sonic Net Wi-Fi · Powered by <span className="text-electric">Pesapal</span>
        {" · "}
        <a href="/admin" className="hover:text-electric transition-colors">Admin</a>
      </div>
    </div>
  );
};

export default CaptivePortal;
