import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";

export const metadata = {
  title: "Sustainability — LUMYNAT",
  description: "Our commitment to the environment, from materials to packaging to the way we ship.",
};

const PILLARS = [
  {
    number: "01",
    title: "Clean-burning ingredients",
    body: "Natural soy wax, phthalate-free fragrance, and cotton wicks are the baseline. They are not a selling point for us — they are a minimum standard. Every material we select is chosen first for safety, then for performance.",
  },
  {
    number: "02",
    title: "Reusable vessels by design",
    body: "Our borosilicate glass vessels are designed to outlast the candle inside them. We print care instructions directly on the box and encourage customers to clean and reuse rather than discard. A candle vessel should become a part of your home, not a piece of waste.",
  },
  {
    number: "03",
    title: "Minimal, recyclable packaging",
    body: "We ship in FSC-certified cardboard with tissue paper made from 100% post-consumer recycled content. No plastic inserts, no foam, no unnecessary materials. The box is sized to the candle — we do not fill empty space with padding.",
  },
  {
    number: "04",
    title: "Small-batch production",
    body: "We make to order, not to stock. Small batches mean less overproduction, less waste, and more control over quality. Every pour is made within 72 hours of your order. This is not a marketing line — it is how our operation is structured.",
  },
];

const NUMBERS = [
  { value: "100%", label: "Natural soy wax — zero paraffin" },
  { value: "0",    label: "Plastic in our packaging" },
  { value: "72h",  label: "From order to pour" },
  { value: "FSC",  label: "Certified paper and cardboard" },
];

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-bg">

      {/* Hero */}
      <div className="relative overflow-hidden bg-bg-dark">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 70% at 40% 60%, #0e2015 0%, #080e0a 60%, #040806 100%)" }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-28 md:py-40">
          <FadeIn>
            <p className="font-body text-[11px] tracking-[0.3em] uppercase text-accent mb-5">
              Our Responsibility
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-light italic text-text-inverse leading-[1.05] mb-6">
              Made with care.<br />
              <span className="not-italic text-accent">Left with less.</span>
            </h1>
            <p className="font-body text-sm text-text-inverse/50 max-w-sm mx-auto leading-relaxed">
              Sustainability is not a campaign. It is the set of decisions we make
              every time we source a material, design a package, or ship an order.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Numbers */}
      <AnimateIn>
        <div className="border-b border-border-subtle">
          <Container className="py-14 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {NUMBERS.map((n) => (
                <div key={n.label}>
                  <p className="font-display text-4xl md:text-5xl font-light text-accent mb-2">{n.value}</p>
                  <p className="font-body text-[11px] text-text-muted leading-snug">{n.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </AnimateIn>

      {/* Pillars */}
      <Container className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto space-y-16">
          {PILLARS.map((p, i) => (
            <AnimateIn key={p.number} delay={i * 75}>
              <div className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-12">
                <p className="font-display text-4xl font-light italic text-accent/30">{p.number}</p>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-light text-text mb-4 leading-snug">{p.title}</h2>
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{p.body}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>

      {/* Promise */}
      <AnimateIn animation="fade-in">
        <div className="bg-bg-dark">
          <Container className="py-20 md:py-24 text-center">
            <blockquote className="font-display text-2xl md:text-3xl font-light italic text-text-inverse leading-relaxed max-w-2xl mx-auto">
              &ldquo;We will never grow so fast that we compromise on material standards.
              Speed and scale are not goals. Quality and care are.&rdquo;
            </blockquote>
            <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mt-8">— LUMYNAT</p>
          </Container>
        </div>
      </AnimateIn>

      <AnimateIn>
        <Container className="py-16 text-center">
          <p className="font-body text-sm text-text-muted mb-6">Want to learn more about our ingredients?</p>
          <Link
            href="/ingredients"
            className="inline-block font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-8 py-4 hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
          >
            View Ingredients
          </Link>
        </Container>
      </AnimateIn>
    </div>
  );
}
