import { useState } from "react";
import { X, Phone, CreditCard, Loader2, CheckCircle, Wifi } from "lucide-react";
import { WifiPackage } from "./PackageCard";

interface PaymentModalProps {
  pkg: WifiPackage;
  onClose: () => void;
  onSuccess: (voucher: string) => void;
}

type PaymentMethod = "mpesa" | "airtel" | "pesapal_card";
type Step = "details" | "processing" | "success";

const generateVoucher = () => {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

const PaymentModal = ({ pkg, onClose, onSuccess }: PaymentModalProps) => {
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("details");

  const handlePay = async () => {
    if (!phone) return;
    setStep("processing");

    // Simulate Pesapal payment processing
    await new Promise((r) => setTimeout(r, 3000));
    const voucher = generateVoucher();
    setStep("success");
    setTimeout(() => onSuccess(voucher), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deep-space/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card-sonic rounded-2xl w-full max-w-md overflow-hidden slide-up">
        {/* Header glow bar */}
        <div className="h-1 bg-gradient-to-r from-electric via-neon to-fire" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {step === "details" && (
            <>
              <h2 className="font-heading text-2xl text-foreground mb-1">Complete Payment</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Powered by <span className="text-electric font-semibold">Pesapal</span>
              </p>

              {/* Package Summary */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-electric/20 border border-electric/30 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-electric" />
                    </div>
                    <div>
                      <p className="font-heading text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.duration} · {pkg.speed}</p>
                    </div>
                  </div>
                  <span className="font-display text-2xl gradient-text-fire">
                    KES {pkg.price}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "mpesa" as const, label: "M-PESA", color: "bg-green-600" },
                    { id: "airtel" as const, label: "Airtel Money", color: "bg-red-600" },
                    { id: "pesapal_card" as const, label: "Card", color: "bg-electric/20" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`py-3 px-2 rounded-xl text-xs font-heading tracking-wide border transition-all ${
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

              {/* Phone Input */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {method === "pesapal_card" ? "Email Address" : "Phone Number"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-electric">
                    {method === "pesapal_card" ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type={method === "pesapal_card" ? "email" : "tel"}
                    placeholder={method === "pesapal_card" ? "your@email.com" : "0712 345 678"}
                    value={method === "pesapal_card" ? email : phone}
                    onChange={(e) =>
                      method === "pesapal_card"
                        ? setEmail(e.target.value)
                        : setPhone(e.target.value)
                    }
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
                  />
                </div>
              </div>

              {method !== "pesapal_card" && (
                <p className="text-xs text-muted-foreground mb-5">
                  You'll receive an STK push to confirm payment of{" "}
                  <strong className="text-fire">KES {pkg.price}</strong>
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={!phone && !email}
                className="btn-fire w-full py-4 rounded-xl font-heading text-xl tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                PAY KES {pkg.price} →
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                🔒 Secured by Pesapal Payment Gateway
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-electric/20 border border-electric/30 flex items-center justify-center mx-auto mb-6 glow-electric">
                <Loader2 className="w-10 h-10 text-electric animate-spin" />
              </div>
              <h2 className="font-heading text-2xl text-foreground mb-2">Processing Payment</h2>
              <p className="text-muted-foreground text-sm">
                {method === "pesapal_card"
                  ? "Processing your card payment..."
                  : `Check your phone for the ${method === "mpesa" ? "M-PESA" : "Airtel Money"} prompt`}
              </p>
              <div className="mt-6 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-electric animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-accent" />
              </div>
              <h2 className="font-heading text-2xl text-accent mb-2">Payment Confirmed!</h2>
              <p className="text-muted-foreground text-sm">Generating your voucher...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
