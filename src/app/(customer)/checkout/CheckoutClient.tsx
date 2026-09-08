"use client";

import { useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCartStore, useCartSubtotal } from "@/stores/cartStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

// ── Stripe promise ─────────────────────────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ── Icons ──────────────────────────────────────────────────
function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
    </svg>
  );
}
function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconLocate({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
    </svg>
  );
}

// ── Stripe Elements appearance ────────────────────────────
const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#B8972A",
    colorBackground: "#FDFAF6",
    colorText: "#2D0A12",
    colorDanger: "#8B3A3A",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #D4B8BC",
      padding: "12px",
      fontSize: "14px",
    },
    ".Input:focus": { border: "1px solid #B8972A", boxShadow: "none" },
    ".Label": {
      fontSize: "11px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: "500",
      color: "#6B1A2A",
    },
  },
};

// ── Contact form fields ────────────────────────────────────
interface ContactShipping {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
}

// ── Promo state shared via prop drilling ──────────────────
interface PromoState {
  promoId:  string;
  code:     string;
  discount: number;
}

// ── Order summary sidebar ─────────────────────────────────
interface OrderSummaryProps {
  promo:    PromoState | null;
  onPromo:  (p: PromoState | null) => void;
  taxRate:              number;
  freeShipThreshold:    number;
  shippingFee:          number;
}

function OrderSummary({ promo, onPromo, taxRate, freeShipThreshold, shippingFee }: OrderSummaryProps) {
  const items    = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();
  const discount  = promo?.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax      = discountedSubtotal * taxRate;
  const freeShip = discountedSubtotal >= freeShipThreshold;
  const total    = discountedSubtotal + tax + (freeShip ? 0 : shippingFee);

  const [promoInput, setPromoInput]     = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState<string | null>(null);

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/checkout/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      onPromo({ promoId: data.promoId, code: data.code, discount: data.discount });
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Invalid code");
      onPromo(null);
    } finally {
      setPromoLoading(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-bg-subtle p-6 space-y-5">
      <h2 className="font-display text-xl font-light text-text">Your Bag</h2>

      <div className="space-y-4">
        {items.map((item) => {
          const linePrice =
            (item.price + item.customizations.reduce((s, c) => s + c.priceModifier, 0)) *
            item.quantity;
          return (
            <div key={item.lineId} className="flex gap-3">
              <div className="relative w-16 h-20 bg-surface shrink-0 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconBag className="w-5 h-5 text-text-faint" />
                  </div>
                )}
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center font-body text-[9px] font-medium text-text-on-gold">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-light text-text leading-snug line-clamp-2">
                  {item.name}
                </p>
                {item.customizations.map((c, i) => (
                  <p key={i} className="font-body text-[10px] text-text-muted mt-0.5">
                    {c.label}: {c.value}
                  </p>
                ))}
              </div>
              <span className="font-body text-sm text-text shrink-0">${linePrice.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <Divider />

      {/* Promo code input */}
      {!promo ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Promo code"
              className="flex-1 bg-surface border border-border px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 tracking-widest uppercase"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="px-3 py-2 bg-text text-text-inverse font-body text-[10px] tracking-widest uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200 disabled:opacity-40 shrink-0"
            >
              {promoLoading ? "…" : "Apply"}
            </button>
          </div>
          {promoError && (
            <p className="font-body text-[11px] text-error">{promoError}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-success/5 border border-success/20 px-3 py-2">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-success">{promo.code}</p>
            <p className="font-body text-[10px] text-success/80">-${promo.discount.toFixed(2)} discount applied</p>
          </div>
          <button
            type="button"
            onClick={() => { onPromo(null); setPromoInput(""); }}
            className="font-body text-[10px] uppercase text-text-muted hover:text-error transition-colors duration-150"
          >
            Remove
          </button>
        </div>
      )}

      <div className="space-y-2 font-body text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount ({promo!.code})</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-text-muted">
          <span>Shipping</span>
          <span className={freeShip ? "text-success" : ""}>{freeShip ? "Free" : `$${shippingFee.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Tax (11%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <Divider className="my-2" />
        <div className="flex justify-between font-medium text-text text-base">
          <span>Total</span>
          <span className="font-display text-xl font-light">${total.toFixed(2)}</span>
        </div>
      </div>

      {!freeShip && (
        <p className="font-body text-[11px] text-text-muted text-center">
          Add <span className="text-text font-medium">${(freeShipThreshold - discountedSubtotal).toFixed(2)}</span> more for free shipping
        </p>
      )}
    </div>
  );
}

// ── Payment form (inside Elements) ────────────────────────
interface PaymentFormProps {
  clientSecret: string;
  orderId: string;
  onBack: () => void;
}

function PaymentForm({ clientSecret: _cs, orderId, onBack }: PaymentFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const clearCart = useCartStore((s) => s.clearCart);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setLoading(false);
    } else {
      clearCart();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        <IconLock className="w-4 h-4" />
        <span className="font-body text-[11px] tracking-wider uppercase">Secure Payment</span>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-text transition-colors duration-200"
        >
          ← Back
        </button>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Place Order
        </Button>
      </div>
    </form>
  );
}

// ── Step indicator ─────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Contact & Shipping", "Payment"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done    = num < current;
        const active  = num === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-body text-[11px] font-medium",
                  done   ? "bg-accent text-text-on-gold" :
                  active ? "bg-text text-text-inverse" :
                           "bg-border text-text-muted"
                )}
              >
                {done ? "✓" : num}
              </span>
              <span className={cn(
                "font-body text-[11px] tracking-wider uppercase",
                active ? "text-text" : "text-text-muted"
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("w-8 h-px mx-3", done ? "bg-accent" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main checkout client ───────────────────────────────────
interface CheckoutClientProps {
  prefill?: {
    firstName: string; lastName: string; email: string; phone: string;
    address1: string; address2: string; city: string; state: string; zip: string; country: string;
  } | null;
  settings?: {
    TAX_RATE: number;
    FREE_SHIPPING_THRESHOLD: number;
    SHIPPING_FEE: number;
  };
}

export function CheckoutClient({ prefill, settings }: CheckoutClientProps) {
  const TAX_RATE                = settings?.TAX_RATE                ?? 0.11;
  const FREE_SHIPPING_THRESHOLD = settings?.FREE_SHIPPING_THRESHOLD ?? 75;
  const SHIPPING_FEE_FLAT       = settings?.SHIPPING_FEE            ?? 8.95;
  const items    = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();

  const [step, setStep]                   = useState<1 | 2>(1);
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [orderId, setOrderId]             = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);
  const [promo, setPromo]                 = useState<PromoState | null>(null);
  const [locating, setLocating]           = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const address1Ref = useRef<HTMLInputElement>(null);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
        })
      );
      const { latitude, longitude } = position.coords;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en-US,en" } }
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();
      const a = data.address ?? {};

      setForm((f) => ({
        ...f,
        city:    a.city ?? a.town ?? a.village ?? a.county ?? f.city,
        state:   a.state ?? f.state,
        zip:     a.postcode ?? f.zip,
        country: a.country_code?.toUpperCase() ?? f.country,
        // Only fill address line if completely empty
        address1: f.address1 || [a.house_number, a.road].filter(Boolean).join(" "),
      }));

      // Focus address line so user can confirm/complete the street
      setTimeout(() => address1Ref.current?.focus(), 50);
    } catch (err) {
      const msg = err instanceof GeolocationPositionError
        ? err.code === 1 ? "Location access denied. Enable it in your browser settings."
        : err.code === 2 ? "Location unavailable. Please enter manually."
        :                  "Location request timed out."
        : "Could not detect location. Please enter manually.";
      setLocationError(msg);
    } finally {
      setLocating(false);
    }
  }

  const [form, setForm] = useState<ContactShipping>({
    firstName: prefill?.firstName ?? "",
    lastName:  prefill?.lastName  ?? "",
    email:     prefill?.email     ?? "",
    phone:     prefill?.phone     ?? "",
    address1:  prefill?.address1  ?? "",
    address2:  prefill?.address2  ?? "",
    city:      prefill?.city      ?? "",
    state:     prefill?.state     ?? "",
    zip:       prefill?.zip       ?? "",
    country:   prefill?.country   ?? "LB",
    notes:     "",
  });

  const set = (field: keyof ContactShipping) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <IconBag className="w-12 h-12 text-text-faint" />
        <div>
          <p className="font-display text-2xl font-light text-text mb-2">Your bag is empty</p>
          <p className="font-body text-sm text-text-muted">Add some candles before checking out.</p>
        </div>
        <Button href="/shop" variant="primary" size="md">Shop Collection</Button>
      </div>
    );
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const discount        = promo?.discount ?? 0;
      const discountedSub   = Math.max(0, subtotal - discount);
      const shippingFee     = discountedSub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE_FLAT;
      const tax             = discountedSub * TAX_RATE;
      const total           = discountedSub + tax + shippingFee;

      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items,
          contact: form,
          totalCents: Math.round(total * 100),
          promoCode: promo?.code ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setStep(2);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-10 md:gap-16">
      {/* Left — form */}
      <div className="flex-1 max-w-xl">
        <Steps current={step} />

        {step === 1 && (
          <form onSubmit={handleShippingSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" required value={form.firstName} onChange={set("firstName")} />
              <Input label="Last Name"  required value={form.lastName}  onChange={set("lastName")} />
            </div>
            <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} />

            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle">
                  Shipping Address
                </p>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 font-body text-[11px] tracking-[0.08em] uppercase text-accent hover:text-text transition-colors duration-150 disabled:opacity-50"
                >
                  <IconLocate className={cn("w-3.5 h-3.5", locating && "animate-spin")} />
                  {locating ? "Detecting…" : "Use my location"}
                </button>
              </div>
              {locationError && (
                <p className="font-body text-[11px] text-error mb-3">{locationError}</p>
              )}
            </div>

            <Input label="Address" required value={form.address1} onChange={set("address1")} placeholder="Street address" ref={address1Ref} />
            <Input label="Apartment, suite, etc." value={form.address2} onChange={set("address2")} placeholder="Optional" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City"      required value={form.city}  onChange={set("city")} />
              <Input label="State / Region" required value={form.state} onChange={set("state")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="ZIP Code"  required value={form.zip}     onChange={set("zip")} />
              <Input label="Country"   required value={form.country} onChange={set("country")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
                Order Notes
              </label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                placeholder="Gift message, delivery instructions…"
                rows={3}
                className="w-full bg-surface border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>

            {formError && (
              <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
                {formError}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              Continue to Payment
            </Button>

            <p className="font-body text-[11px] text-text-muted text-center">
              <Link href="/shop" className="hover:text-accent transition-colors">← Back to shop</Link>
            </p>
          </form>
        )}

        {step === 2 && clientSecret && orderId && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              orderId={orderId}
              onBack={() => setStep(1)}
            />
          </Elements>
        )}
      </div>

      {/* Right — order summary */}
      <div className="md:w-80 shrink-0">
        <OrderSummary
          promo={promo}
          onPromo={setPromo}
          taxRate={TAX_RATE}
          freeShipThreshold={FREE_SHIPPING_THRESHOLD}
          shippingFee={SHIPPING_FEE_FLAT}
        />
      </div>
    </div>
  );
}
