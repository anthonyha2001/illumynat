import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Our Story — LUMYNAT",
  description:
    "LUMYNAT began with a single candle poured on a kitchen counter. Learn how obsession with fragrance became a craft.",
};

// ── Editorial sections ─────────────────────────────────────

const VALUES = [
  {
    number: "01",
    title:  "Small Batches Only",
    body:   "We never pour more than we can oversee by hand. Every candle leaves our studio within days of being made — never warehoused for months.",
  },
  {
    number: "02",
    title:  "Fragrance as Architecture",
    body:   "We treat a scent the way a designer treats a room. Top notes open the door. Heart notes define the space. Base notes linger long after you leave.",
  },
  {
    number: "03",
    title:  "No Shortcuts",
    body:   "We use single-origin coconut-soy wax, lead-free cotton wicks, and fragrance oils tested for skin safety — even though no one is wearing these candles.",
  },
  {
    number: "04",
    title:  "Designed to Last",
    body:   "Our vessels are made to be kept. Heavy glass, clean lines, no loud branding. When the wax is gone, the jar stays.",
  },
];

const TIMELINE = [
  { year: "2019", event: "First batch of 12 candles poured on a kitchen counter in Beirut." },
  { year: "2020", event: "First stockist. A concept store in Gemmayzeh took a chance on us." },
  { year: "2021", event: "Moved to a dedicated studio. Added the first seasonal collection." },
  { year: "2023", event: "Launched gifting program. Over 2,000 gift sets delivered that year." },
  { year: "2024", event: "Expanded to four scent families. 18 candles, no fillers." },
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="Est. 2019"
        title="Made by hand. Meant to last."
        description="LUMYNAT began with a question: why does a room smell like nothing? Four years and ten thousand pours later, we're still answering it."
        centered
      />

      {/* ── Origin story ── */}
      <AnimateIn>
      <Container className="py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-6">
              The Beginning
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light italic text-text leading-tight mb-6">
              A kitchen counter.<br />A single wick.
            </h2>
            <div className="space-y-4 font-body text-sm text-text-subtle leading-relaxed">
              <p>
                It started out of frustration. Every candle on the market smelled either
                aggressively synthetic or faintly of nothing. Neither felt like home.
              </p>
              <p>
                So we started experimenting. We ordered small quantities of wax, fragrance
                oils, and wicks. We burned through a lot of bad combinations before we found
                the one that worked. The first good candle took eleven attempts.
              </p>
              <p>
                We gave twelve away to friends. Three of them asked where they could buy more.
                That was the moment LUMYNAT became real.
              </p>
            </div>
          </div>

          {/* Placeholder atmospheric image */}
          <div className="relative aspect-[3/4] bg-bg-subtle overflow-hidden">
            <div
              className="w-full h-full"
              style={{
                background:
                  "radial-gradient(ellipse 70% 70% at 50% 40%, #3d2e1e 0%, #1a1108 70%, #0a0804 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-8xl font-light italic text-text-inverse/10">I</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="font-body text-[10px] tracking-widest uppercase text-text-inverse/30">
                Studio, 2021
              </p>
            </div>
          </div>
        </div>
      </Container>
      </AnimateIn>

      {/* ── Values ── */}
      <AnimateIn>
      <div className="bg-bg-subtle border-y border-border-subtle">
        <Container className="py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
              How We Work
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light italic text-text">
              Four principles.<br />No exceptions.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border-subtle">
            {VALUES.map((v) => (
              <div key={v.number} className="bg-bg-subtle p-8 md:p-10">
                <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-4">
                  {v.number}
                </p>
                <h3 className="font-display text-2xl font-light text-text mb-3 leading-snug">
                  {v.title}
                </h3>
                <p className="font-body text-sm text-text-muted leading-relaxed">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>
      </AnimateIn>

      {/* ── Timeline ── */}
      <AnimateIn>
      <Container className="py-20 md:py-28">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
              The Journey
            </p>
            <h2 className="font-display text-4xl font-light italic text-text">
              Five years in five lines.
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-border-subtle" />

            <div className="space-y-0">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className="flex gap-8 relative">
                  {/* Year */}
                  <div className="w-14 shrink-0 pt-1 text-right">
                    <span className="font-display text-sm font-light text-accent">
                      {item.year}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0 z-10" />
                    {i < TIMELINE.length - 1 && (
                      <div className="flex-1 w-px bg-transparent mt-1" />
                    )}
                  </div>

                  {/* Event */}
                  <div className="flex-1 pb-10">
                    <p className="font-body text-sm text-text-subtle leading-relaxed pt-0.5">
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
      </AnimateIn>

      {/* ── Pull quote ── */}
      <AnimateIn animation="fade-in">
      <div className="bg-bg-dark">
        <Container className="py-20 md:py-28 text-center">
          <blockquote className="font-display text-3xl md:text-4xl font-light italic text-text-inverse leading-relaxed max-w-3xl mx-auto">
            &ldquo;Fragrance is not decoration. It is the difference between a room
            you pass through and a room you remember.&rdquo;
          </blockquote>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mt-8">
            — LUMYNAT, 2019
          </p>
        </Container>
      </div>
      </AnimateIn>

      {/* ── CTA ── */}
      <AnimateIn>
      <Container className="py-20 md:py-24 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-light italic text-text mb-6">
          Ready to find yours?
        </h2>
        <div className="flex items-center justify-center gap-8">
          <Link
            href="/shop"
            className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
          >
            Shop Collection
          </Link>
          <Link
            href="/collections"
            className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted hover:text-accent transition-colors duration-200"
          >
            Browse by Scent →
          </Link>
        </div>
      </Container>
      </AnimateIn>
    </div>
  );
}
