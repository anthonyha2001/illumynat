"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { cn } from "@/utils/cn";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#B8972A",
    colorBackground: "#FDFAF6",
    colorText: "#2D0A12",
    colorDanger: "#8B3A3A",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0px",
  },
  rules: {
    ".Input": { border: "1px solid #D4B8BC", padding: "12px", fontSize: "14px" },
    ".Input:focus": { border: "1px solid #B8972A", boxShadow: "none" },
    ".Label": { fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontWeight: "500", color: "#6B1A2A" },
  },
};

const PRESET_AMOUNTS = [25, 50, 75, 100, 150, 200];

// ── Payment step ──────────────────────────────────────────
interface PaymentStepProps {
  clientSecret: string;
  amount: number;
  onBack: () => void;
  onSuccess: () => void;
}

function PaymentStep({ clientSecret, amount, onBack, onSuccess }: PaymentStepProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed.");
      setLoading(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-bg-subtle border border-border-subtle p-4 flex justify-between items-center">
        <span className="font-body text-sm text-text-muted">Gift card amount</span>
        <span className="font-display text-2xl font-light text-text">${amount}</span>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-text transition-colors duration-200"
        >
          ← Back
        </button>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Purchase Gift Card
        </Button>
      </div>
    </form>
  );
}

// ── Success state ─────────────────────────────────────────
function SuccessState({ amount }: { amount: number }) {
  return (
    <div className="text-center py-12 space-y-6">
      <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-3xl font-light italic text-text mb-2">
          Gift card sent!
        </h2>
        <p className="font-body text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
          A <span className="text-text font-medium">${amount}</span> gift card has been issued.
          The recipient will receive an email with their unique code shortly.
        </p>
      </div>
      <div className="flex items-center justify-center gap-6 pt-2">
        <Button href="/gifting" variant="primary" size="md">Back to Gifting</Button>
        <Button href="/shop" variant="secondary" size="md">Shop Collection</Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export function GiftCardClient() {
  const [step, setStep]               = useState<"details" | "payment" | "success">("details");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(50);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [form, setForm] = useState({
    recipientName:  "",
    recipientEmail: "",
    senderName:     "",
    message:        "",
  });

  const finalAmount = customAmount
    ? parseFloat(customAmount)
    : (selectedPreset ?? 0);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAmount || finalAmount < 25) {
      setError("Minimum gift card amount is $25");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gift-card/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents:   Math.round(finalAmount * 100),
          recipientEmail: form.recipientEmail,
          recipientName:  form.recipientName,
          senderName:     form.senderName,
          message:        form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") return <SuccessState amount={finalAmount} />;

  return (
    <div>
      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="space-y-8">
          {/* Amount picker */}
          <div>
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle mb-4">
              Amount
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setSelectedPreset(amt); setCustomAmount(""); }}
                  className={cn(
                    "py-3 font-body text-sm border transition-colors duration-150",
                    selectedPreset === amt && !customAmount
                      ? "bg-accent text-text-on-gold border-accent"
                      : "bg-surface border-border text-text hover:border-accent"
                  )}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <Input
              label="Custom Amount"
              type="number"
              min={25}
              step={5}
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
              placeholder="e.g. 75"
              prefix="$"
            />
          </div>

          <Divider />

          {/* Recipient */}
          <div className="space-y-4">
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle">
              Recipient Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Recipient Name" required value={form.recipientName} onChange={set("recipientName")} />
              <Input label="Sender Name" value={form.senderName} onChange={set("senderName")} />
            </div>
            <Input label="Recipient Email" type="email" required value={form.recipientEmail} onChange={set("recipientEmail")} hint="The gift card code will be sent here." />
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
                Personal Message
              </label>
              <textarea
                value={form.message}
                onChange={set("message")}
                placeholder="A personal note to include with the gift card…"
                rows={3}
                className="w-full bg-surface border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-body text-[11px] text-text-muted">Total</p>
              <p className="font-display text-2xl font-light text-text">
                ${finalAmount > 0 ? finalAmount.toFixed(2) : "—"}
              </p>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Continue to Payment
            </Button>
          </div>
        </form>
      )}

      {step === "payment" && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
        >
          <PaymentStep
            clientSecret={clientSecret}
            amount={finalAmount}
            onBack={() => setStep("details")}
            onSuccess={() => setStep("success")}
          />
        </Elements>
      )}
    </div>
  );
}
