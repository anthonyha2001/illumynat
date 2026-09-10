import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import Link from "next/link";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Ingredients — LUMYNAT",
  description: "Every ingredient in our candles, explained. We believe in radical transparency about what you burn in your home.",
};

const INGREDIENTS = [
  {
    name: "100% Natural Soy Wax",
    tag: "Wax",
    body: "We use only premium, sustainably sourced soy wax — never paraffin. Soy burns cleaner, cooler, and longer than petroleum-based waxes, producing minimal soot and no known carcinogens. Our soy is non-GMO and sourced from North American farms.",
    detail: "Burn time is 20–30% longer than paraffin equivalents. Soy also has a lower melting point, which means a stronger cold throw and a more even hot throw as it pools.",
  },
  {
    name: "Phthalate-Free Fragrance Oils",
    tag: "Fragrance",
    body: "All of our fragrance oils are blended in-house and formulated without phthalates, parabens, carcinogens, reproductive toxins, or any of the 1,300+ substances banned under EU cosmetic regulations. We test every batch before it goes into production.",
    detail: "Fragrance load sits between 8–12% depending on the scent family. Heavier florals and woods sit at the higher end; aquatics and citrus at the lower end to prevent crystallisation.",
  },
  {
    name: "Lead-Free Cotton Wicks",
    tag: "Wick",
    body: "Our flat-braided cotton wicks are selected individually for each vessel diameter. The right wick is the difference between a candle that tunnels, mushrooms, or burns exactly the way it should. We size test every new SKU before releasing it.",
    detail: "We do not use zinc or lead-core wicks. The braided cotton construction ensures a consistent flame height and a clean, self-trimming burn after the first use.",
  },
  {
    name: "Borosilicate Glass Vessels",
    tag: "Vessel",
    body: "Every LUMYNAT candle comes in heat-resistant borosilicate glass — the same material used in laboratory glassware. It handles thermal stress better than standard soda-lime glass, making it safer and more durable throughout the candle's life.",
    detail: "Once your candle is finished, the vessel is fully reusable. Clean it out with warm water and use it as a glass, pen holder, or planter. We designed it to last.",
  },
  {
    name: "Wooden Lids",
    tag: "Lid",
    body: "Our lids are turned from sustainably sourced FSC-certified wood — maple, walnut, or beech depending on the collection. Each lid is sanded and finished with food-safe oil. No lacquers, no varnishes, nothing synthetic.",
    detail: "The lid serves a functional purpose: it protects the wax from dust and preserves the cold throw between uses. It is also designed to double as a coaster when the candle is lit.",
  },
];

const WHAT_WE_NEVER_USE = [
  "Paraffin wax",
  "Phthalates",
  "Lead or zinc wicks",
  "Synthetic dyes",
  "Carcinogens",
  "Reproductive toxins",
  "Palm wax",
  "Petroleum derivatives",
];

export default function IngredientsPage() {
  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="Full Transparency"
        title="What's inside every candle."
        description="We believe you have the right to know exactly what you burn in your home."
        centered
      />

      {/* Ingredients */}
      <Container className="py-20 md:py-28">
        <div className="space-y-0 divide-y divide-border-subtle">
          {INGREDIENTS.map((item, i) => (
            <AnimateIn key={item.name} delay={i * 60}>
              <div className="py-12 md:py-14 grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
                <div>
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-accent mb-2">{item.tag}</p>
                  <h2 className="font-display text-2xl font-light text-text leading-snug">{item.name}</h2>
                </div>
                <div className="space-y-4">
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{item.body}</p>
                  <p className="font-body text-[13px] text-text-muted leading-relaxed border-l-2 border-accent/30 pl-4">
                    {item.detail}
                  </p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>

      {/* What we never use */}
      <AnimateIn>
        <div className="bg-bg-subtle border-y border-border-subtle">
          <Container className="py-16 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">Our Commitments</p>
              <h2 className="font-display text-3xl md:text-4xl font-light italic text-text mb-10">
                What we never use.
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {WHAT_WE_NEVER_USE.map((item) => (
                  <div key={item} className="flex items-center gap-2 justify-center">
                    <span className="text-accent text-xs">✕</span>
                    <span className="font-body text-sm text-text-subtle">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>
      </AnimateIn>

      {/* CTA */}
      <AnimateIn>
        <Container className="py-16 text-center">
          <p className="font-body text-sm text-text-muted mb-6">
            Questions about a specific ingredient or allergy concern?
          </p>
          <Link
            href="/contact"
            className="inline-block font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-8 py-4 hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
          >
            Contact Us
          </Link>
        </Container>
      </AnimateIn>
    </div>
  );
}
