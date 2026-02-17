import { Copy, Check, Wifi } from "lucide-react";
import { useState } from "react";

interface PackageLike {
  name: string;
  duration_label?: string;
  speed_mbps?: number;
  // Legacy fields
  duration?: string;
  speed?: string;
}

interface VoucherDisplayProps {
  voucher: string;
  expiresAt?: string;
  pkg: PackageLike;
  onClose: () => void;
}

const VoucherDisplay = ({ voucher, expiresAt, pkg, onClose }: VoucherDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const durationLabel = pkg.duration_label || pkg.duration || "";

  const copyVoucher = () => {
    navigator.clipboard.writeText(voucher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-deep-space/90 backdrop-blur-sm" />

      <div className="relative card-sonic rounded-2xl w-full max-w-md overflow-hidden slide-up">
        <div className="h-1 bg-gradient-to-r from-electric via-neon to-fire animate-pulse" />

        <div className="p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-electric/20 border-2 border-electric/50 flex items-center justify-center mx-auto mb-6 float-animation glow-electric">
            <Wifi className="w-12 h-12 text-electric" />
          </div>

          <h2 className="font-display text-4xl gradient-text-electric mb-2">YOUR VOUCHER</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {pkg.name}{durationLabel ? ` · ${durationLabel}` : ""}
          </p>

          <div className="bg-muted/30 border border-electric/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="speed-line-bg opacity-50" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">Wi-Fi Access Code</p>
            <div className="font-display text-3xl tracking-widest shimmer-text cursor-pointer" onClick={copyVoucher}>
              {voucher}
            </div>
            {expiresAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Valid until {new Date(expiresAt).toLocaleString()}
              </p>
            )}
            <button onClick={copyVoucher} className="mt-4 flex items-center gap-2 mx-auto text-sm text-electric hover:text-neon transition-colors">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
            </button>
          </div>

          <div className="text-left bg-muted/20 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">How to connect</p>
            {["Connect to 'Sonic Net' Wi-Fi network", "Open any browser", "Enter your 4-digit voucher code", "Enjoy lightning-fast internet!"].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-electric/20 border border-electric/30 text-electric text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={copyVoucher} className="flex-1 btn-electric py-3 rounded-xl font-heading text-lg flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" />
              {copied ? "COPIED!" : "COPY CODE"}
            </button>
            <button onClick={onClose} className="flex-1 border border-border rounded-xl py-3 font-heading text-lg text-muted-foreground hover:border-electric/40 hover:text-electric transition-all">
              BUY MORE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDisplay;
