import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "failed" | "pending">("checking");
  const [voucher, setVoucher] = useState<{ code: string; expires_at: string } | null>(null);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) { navigate("/"); return; }
    checkPaymentStatus();
  }, [orderId]);

  const checkPaymentStatus = async () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

    // Poll up to 10 times
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const resp = await fetch(`${baseUrl}/pesapal-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await resp.json();

        if (data.status === "completed" && data.voucher) {
          setVoucher(data.voucher);
          setStatus("success");
          return;
        }
        if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setStatus("pending");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-sonic rounded-2xl w-full max-w-sm p-8 text-center">
        <div className="h-1 bg-gradient-to-r from-electric via-neon to-fire mb-8 -mx-8 -mt-8 rounded-t-2xl" />

        {status === "checking" && (
          <>
            <div className="w-20 h-20 rounded-full bg-electric/20 border border-electric/30 flex items-center justify-center mx-auto mb-6 glow-electric">
              <Loader2 className="w-10 h-10 text-electric animate-spin" />
            </div>
            <h2 className="font-heading text-2xl text-foreground mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your payment...</p>
            <div className="flex justify-center gap-2 mt-4">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-electric animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </>
        )}

        {status === "success" && voucher && (
          <>
            <div className="w-20 h-20 rounded-full bg-electric/20 border border-electric/30 flex items-center justify-center mx-auto mb-6 glow-electric float-animation">
              <Wifi className="w-10 h-10 text-electric" />
            </div>
            <h2 className="font-heading text-2xl gradient-text-electric mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground text-sm mb-5">Your Wi-Fi voucher is ready</p>
            <div className="bg-muted/30 border border-electric/30 rounded-2xl p-5 mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Access Code</p>
              <p className="font-display text-3xl shimmer-text tracking-widest">{voucher.code}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Valid until {new Date(voucher.expires_at).toLocaleString()}
              </p>
            </div>
            <div className="text-left space-y-2 bg-muted/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">How to connect</p>
              {["Connect to 'SONIC-WIFI' network", "Open any browser", "Enter the code above", "Enjoy fast internet!"].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-electric/20 border border-electric/30 text-electric text-xs flex items-center justify-center flex-shrink-0 font-bold">{i+1}</span>
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(voucher.code); }}
              className="btn-electric w-full py-3 rounded-xl font-heading text-lg"
            >
              COPY CODE
            </button>
            <button onClick={() => navigate("/")} className="w-full mt-2 py-3 text-sm text-muted-foreground hover:text-electric transition-colors">
              Buy another voucher
            </button>
          </>
        )}

        {(status === "failed" || status === "pending") && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="font-heading text-2xl text-destructive mb-2">
              {status === "failed" ? "Payment Failed" : "Payment Pending"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {status === "failed"
                ? "Your payment could not be processed. Please try again."
                : "Payment is still being processed. If you paid, your voucher will appear shortly."}
            </p>
            <button onClick={() => navigate("/")} className="btn-fire w-full py-3 rounded-xl font-heading text-lg">
              TRY AGAIN
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
