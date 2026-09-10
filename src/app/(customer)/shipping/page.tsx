import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import Link from "next/link";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Shipping & Returns — LUMYNAT",
  description: "Our shipping policy, delivery times, and hassle-free return process.",
};

const SHIPPING_OPTIONS = [
  {
    name: "Standard Shipping",
    time: "5–7 business days",
    cost: "Free on orders over $75",
    detail: "Tracked from our studio to your door. You will receive a tracking number via email as soon as your order ships.",
  },
  {
    name: "Express Shipping",
    time: "2–3 business days",
    cost: "$12.00 flat rate",
    detail: "Available for all orders placed before 12pm local time. Orders placed after 12pm are dispatched the following business day.",
  },
  {
    name: "Overnight Shipping",
    time: "Next business day",
    cost: "$24.00 flat rate",
    detail: "Order before 12pm for next business day delivery. Weekend and public holiday exclusions apply.",
  },
];

const RETURN_STEPS = [
  { step: "01", title: "Contact us", body: "Email us at returns@lumynat.com within 30 days of receiving your order. Include your order number and a brief note about why you are returning." },
  { step: "02", title: "We send a label", body: "We will send you a prepaid return shipping label within 24 hours. You do not need to arrange anything — just print and attach." },
  { step: "03", title: "Drop it off", body: "Pack the item securely and drop it off at any courier location. The item must be unused and in its original packaging." },
  { step: "04", title: "Refund processed", body: "Once we receive and inspect the return, your refund is processed within 3–5 business days to your original payment method." },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="Policies"
        title="Shipping & Returns"
        description="Every order is packed by hand and inspected before it leaves our studio."
      />

      {/* Shipping options */}
      <Container className="py-16 md:py-20">
        <AnimateIn>
          <h2 className="font-display text-3xl font-light italic text-text mb-10">Delivery options</h2>
        </AnimateIn>
        <div className="grid md:grid-cols-3 gap-6">
          {SHIPPING_OPTIONS.map((opt, i) => (
            <AnimateIn key={opt.name} delay={i * 75}>
              <div className="bg-bg-subtle border border-border-subtle p-8 flex flex-col gap-4">
                <div>
                  <h3 className="font-display text-xl font-light text-text mb-1">{opt.name}</h3>
                  <p className="font-body text-[11px] tracking-widest uppercase text-accent">{opt.time}</p>
                </div>
                <p className="font-display text-2xl font-light text-text">{opt.cost}</p>
                <p className="font-body text-sm text-text-muted leading-relaxed">{opt.detail}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn>
          <div className="mt-8 p-6 border border-accent/20 bg-accent-pale">
            <p className="font-body text-sm text-text-subtle leading-relaxed">
              <span className="text-accent font-medium">Free standard shipping</span> on all orders over $75. Orders are processed and dispatched within 72 hours — usually sooner. You will receive tracking information as soon as your parcel leaves our studio.
            </p>
          </div>
        </AnimateIn>
      </Container>

      {/* Returns */}
      <AnimateIn>
        <div className="bg-bg-subtle border-y border-border-subtle">
          <Container className="py-16 md:py-20">
            <h2 className="font-display text-3xl font-light italic text-text mb-4">Returns & exchanges</h2>
            <p className="font-body text-sm text-text-muted leading-relaxed max-w-xl mb-12">
              We accept returns within 30 days of delivery for unused items in their original packaging. If something arrived damaged, we will replace it immediately — no questions asked.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {RETURN_STEPS.map((s, i) => (
                <AnimateIn key={s.step} delay={i * 75}>
                  <div className="flex flex-col gap-4">
                    <p className="font-display text-4xl font-light italic text-accent/30">{s.step}</p>
                    <h3 className="font-display text-xl font-light text-text">{s.title}</h3>
                    <p className="font-body text-sm text-text-muted leading-relaxed">{s.body}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </Container>
        </div>
      </AnimateIn>

      {/* Notes */}
      <AnimateIn>
        <Container className="py-14 md:py-16">
          <div className="max-w-2xl space-y-6">
            <h2 className="font-display text-2xl font-light italic text-text">Additional notes</h2>
            <div className="space-y-4 font-body text-sm text-text-subtle leading-relaxed">
              <p>Gift orders can be returned by the recipient using the same process. Contact us with the order number from the gift receipt included in the package.</p>
              <p>Sale items and personalised products are final sale and not eligible for return.</p>
              <p>International orders may be subject to customs duties and taxes. These are the responsibility of the recipient and are not included in our pricing.</p>
              <p>We currently ship to the United States, Canada, the United Kingdom, Australia, and most of Western Europe.</p>
            </div>
            <Link href="/contact" className="inline-block font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-8 py-3 hover:bg-accent hover:text-text-on-gold transition-colors duration-200 mt-2">
              Contact Support
            </Link>
          </div>
        </Container>
      </AnimateIn>
    </div>
  );
}
