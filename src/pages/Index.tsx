import { useState } from "react";
import { Wifi, Zap, Shield, BarChart3, ChevronDown } from "lucide-react";
import PackageCard, { wifiPackages, WifiPackage } from "@/components/PackageCard";
import PaymentModal from "@/components/PaymentModal";
import VoucherDisplay from "@/components/VoucherDisplay";
import AdminDashboard from "@/components/AdminDashboard";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [selectedPkg, setSelectedPkg] = useState<WifiPackage | null>(null);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [paidPkg, setPaidPkg] = useState<WifiPackage | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleSelect = (pkg: WifiPackage) => {
    setSelectedPkg(pkg);
    setVoucher(null);
  };

  const handlePaymentSuccess = (voucherCode: string) => {
    setPaidPkg(selectedPkg);
    setSelectedPkg(null);
    setVoucher(voucherCode);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-electric/20 border border-electric/40 flex items-center justify-center wifi-pulse">
              <Wifi className="w-5 h-5 text-electric" />
            </div>
            <span className="font-display text-2xl gradient-text-electric tracking-wider">
              SONIC WIFI.NET
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdmin(true)}
              className="text-muted-foreground hover:text-electric transition-colors text-sm font-heading tracking-wide"
            >
              ADMIN
            </button>
            <button
              onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-electric px-5 py-2 rounded-xl text-sm"
            >
              GET VOUCHER
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Hero Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="speed-line-bg" />

        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-electric/10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-electric/10 border border-electric/30 rounded-full px-4 py-2 mb-6 text-electric text-sm font-semibold">
            <Zap className="w-3 h-3" />
            Lightning Fast Internet Access
          </div>

          {/* Title */}
          <h1 className="font-display text-7xl md:text-9xl mb-4 leading-none">
            <span className="gradient-text-electric">SONIC</span>
            <br />
            <span className="gradient-text-fire">WIFI.NET</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-4 font-heading max-w-xl mx-auto">
            Blazing fast internet at your fingertips. Buy a voucher in seconds,
            connect instantly.
          </p>

          {/* Payment badges */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="text-xs text-muted-foreground">Accepted:</span>
            <span className="bg-secondary/30 border border-secondary/40 text-secondary px-3 py-1 rounded-full text-xs font-bold">
              M-PESA
            </span>
            <span className="bg-destructive/20 border border-destructive/30 text-destructive px-3 py-1 rounded-full text-xs font-bold">
              AIRTEL MONEY
            </span>
            <span className="bg-electric/20 border border-electric/30 text-electric px-3 py-1 rounded-full text-xs font-bold">
              CARD
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() =>
                document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-fire px-8 py-4 rounded-2xl font-heading text-xl"
            >
              ⚡ BUY VOUCHER NOW
            </button>
            <button
              onClick={() =>
                document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-electric px-8 py-4 rounded-2xl font-heading text-xl"
            >
              VIEW PACKAGES
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <span className="text-xs uppercase tracking-widest">See Plans</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ===== FEATURES BAR ===== */}
      <section className="border-y border-border bg-card/50 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Zap, label: "Up to 50 Mbps", sub: "Blazing fast speeds" },
              { icon: Shield, label: "Secure & Encrypted", sub: "Protected browsing" },
              { icon: Wifi, label: "Instant Connect", sub: "No setup required" },
              { icon: BarChart3, label: "Pay via Pesapal", sub: "M-PESA · Airtel · Card" },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-9 h-9 rounded-lg bg-electric/20 border border-electric/30 flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-4 h-4 text-electric" />
                </div>
                <div className="text-left">
                  <p className="font-heading text-sm text-foreground">{feat.label}</p>
                  <p className="text-xs text-muted-foreground">{feat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PACKAGES ===== */}
      <section id="packages" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-5xl md:text-6xl gradient-text-electric mb-4">
              CHOOSE YOUR SPEED
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Pick a package that fits your needs. All plans include full-speed access
              and instant voucher delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wifiPackages.map((pkg, i) => (
              <div key={pkg.id} className="slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <PackageCard pkg={pkg} onSelect={handleSelect} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-5xl gradient-text-fire mb-4">HOW IT WORKS</h2>
            <p className="text-muted-foreground">Connected in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "01",
                title: "Choose a Package",
                desc: "Pick any Wi-Fi plan from our affordable packages — from 1 hour to a full month.",
                color: "electric",
              },
              {
                step: "02",
                title: "Pay via Pesapal",
                desc: "Complete payment instantly using M-PESA, Airtel Money, or your debit/credit card.",
                color: "fire",
              },
              {
                step: "03",
                title: "Get Your Voucher",
                desc: "Receive your unique access code immediately. Enter it on the portal and go online!",
                color: "electric",
              },
            ].map((step) => (
              <div key={step.step} className="card-sonic rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="speed-line-bg opacity-30" />
                <div
                  className={`font-display text-7xl mb-4 ${
                    step.color === "fire" ? "gradient-text-fire" : "gradient-text-electric"
                  }`}
                >
                  {step.step}
                </div>
                <h3 className="font-heading text-xl text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KABEJJA SYSTEMS AD ===== */}
      <section className="py-6 px-4 bg-gradient-to-r from-fire/10 via-card to-electric/10 border-y border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">🚀 Powered &amp; Built by</p>
            <p className="font-display text-2xl gradient-text-fire">Kabejja Systems</p>
            <p className="text-sm text-muted-foreground mt-1">Professional Hotspot &amp; IT Solutions for your Business</p>
          </div>
          <a
            href="https://www.kabejjasystems.store"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fire px-6 py-3 rounded-xl font-heading text-sm whitespace-nowrap flex-shrink-0"
          >
            Visit Us → kabejjasystems.store
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-electric" />
            <span className="font-display text-xl gradient-text-electric">SONIC WIFI.NET</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Powered by <span className="text-electric font-semibold">Pesapal</span> · Built by{" "}
            <a href="https://www.kabejjasystems.store" target="_blank" rel="noopener noreferrer" className="text-fire font-semibold hover:underline">Kabejja Systems</a>
          </p>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Sonic Wifi.Net. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      {selectedPkg && (
        <PaymentModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {voucher && paidPkg && (
        <VoucherDisplay
          voucher={voucher}
          pkg={paidPkg}
          onClose={() => {
            setVoucher(null);
            setPaidPkg(null);
          }}
        />
      )}

      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default Index;
