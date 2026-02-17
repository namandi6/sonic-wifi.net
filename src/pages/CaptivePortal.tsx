import { useState, useEffect } from "react";
import { Wifi, Zap, Clock, Users, ChevronRight, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VoucherDisplay from "@/components/VoucherDisplay";
import heroBg from "@/assets/hero-bg.jpg";

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
        }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      window.location.href = data.redirect_url;

    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="relative z-10 text-center py-10 px-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-electric/20 border-2 border-electric/50 flex items-center justify-center wifi-pulse">
              <Wifi className="w-7 h-7 text-electric" />
            </div>
            <h1 className="font-display text-5xl gradient-text-electric">SONIC WI-FI</h1>
          </div>
          <p className="text-muted-foreground font-heading text-lg">Lightning fast internet · Buy a voucher below</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="bg-secondary/20 border border-secondary/30 text-secondary px-3 py-1 rounded-full text-xs font-bold">M-PESA</span>
            <span className="bg-destructive/20 border border-destructive/30 text-destructive px-3 py-1 rounded-full text-xs font-bold">AIRTEL</span>
            <span className="bg-electric/20 border border-electric/30 text-electric px-3 py-1 rounded-full text-xs font-bold">CARD</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full">

        {step === "packages" && (
          <div className="space-y-3">
            <h2 className="font-heading text-xl text-muted-foreground uppercase tracking-wider mb-4">Choose a Package</h2>
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => { setSelected(pkg); setStep("payment"); }}
                className={`w-full card-sonic rounded-2xl p-4 text-left flex items-center gap-4 transition-all ${pkg.is_popular ? "package-popular" : ""}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${pkg.is_popular ? "bg-fire/20 border border-fire/30" : "bg-electric/20 border border-electric/30"}`}>
                  <Wifi className={`w-6 h-6 ${pkg.is_popular ? "text-fire" : "text-electric"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg text-foreground">{pkg.name}</span>
                    {pkg.is_popular && (
                      <span className="bg-fire/20 text-fire text-xs font-bold px-2 py-0.5 rounded-full border border-fire/30">POPULAR</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration_label}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{pkg.speed_mbps} Mbps</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pkg.max_devices} device{pkg.max_devices > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-display text-2xl ${pkg.is_popular ? "gradient-text-fire" : "gradient-text-electric"}`}>
                    KES {pkg.price_kes}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "payment" && selected && (
          <div className="slide-up">
            <button
              onClick={() => setStep("packages")}
              className="text-muted-foreground hover:text-electric transition-colors text-sm font-heading mb-5 flex items-center gap-1"
            >
              ← Back to packages
            </button>

            {/* Summary */}
            <div className="card-sonic rounded-2xl p-4 mb-5 border border-electric/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-xl text-foreground">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.duration_label} · {selected.speed_mbps} Mbps</p>
                </div>
                <span className="font-display text-3xl gradient-text-fire">KES {selected.price_kes}</span>
              </div>
            </div>

            {/* Method */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "mpesa" as const, label: "M-PESA" },
                  { id: "airtel" as const, label: "Airtel Money" },
                  { id: "card" as const, label: "Card" },
                ] as { id: "mpesa" | "airtel" | "card"; label: string }[]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`py-3 rounded-xl text-sm font-heading border transition-all ${
                      method === m.id
                        ? "border-electric bg-electric/10 text-electric"
                        : "border-border text-muted-foreground hover:border-electric/40"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {method === "card" ? "Email Address" : "Phone Number"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-electric">
                  {method === "card" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type={method === "card" ? "email" : "tel"}
                  placeholder={method === "card" ? "your@email.com" : "0712 345 678"}
                  value={method === "card" ? email : phone}
                  onChange={(e) => method === "card" ? setEmail(e.target.value) : setPhone(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
                />
              </div>
            </div>

            {method !== "card" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="email"
                    placeholder="receipt@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={loading || (!phone && !email)}
              className="btn-fire w-full py-4 rounded-2xl font-heading text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Redirecting to Pesapal..." : `PAY KES ${selected.price_kes} →`}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              🔒 Secured by Pesapal Payment Gateway
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Sonic Wi-Fi · Powered by <span className="text-electric">Pesapal</span>
        {" · "}
        <a href="/admin" className="hover:text-electric transition-colors">Admin</a>
      </div>
    </div>
  );
};

export default CaptivePortal;
