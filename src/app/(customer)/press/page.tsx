import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Press — LUMYNAT",
  description: "Media coverage, editorial features, and press resources for LUMYNAT.",
};

const PRESS = [
  {
    outlet: "Vogue Living",
    quote: "LUMYNAT has done something rare: created a candle that smells exactly as its name suggests, every single time.",
    issue: "October 2024",
    category: "Home & Design",
  },
  {
    outlet: "Wallpaper*",
    quote: "The kind of object you place on a shelf and never want to hide. The vessel is as considered as the scent inside it.",
    issue: "September 2024",
    category: "Design",
  },
  {
    outlet: "Monocle",
    quote: "Small-batch, single-city, obsessively made. LUMYNAT is the benchmark for what artisan candlemaking can be.",
    issue: "August 2024",
    category: "Lifestyle",
  },
  {
    outlet: "Apartamento",
    quote: "We have been lighting the same candle for three months. That is all we need to say.",
    issue: "Spring 2024",
    category: "Interiors",
  },
  {
    outlet: "Dezeen",
    quote: "The borosilicate glass vessel is designed to outlast the candle — and likely will, given how carefully you will treat it.",
    issue: "July 2024",
    category: "Design",
  },
  {
    outlet: "The Sunday Times Style",
    quote: "If we had to pick one luxury candle brand for 2024, this would be it. Without hesitation.",
    issue: "June 2024",
    category: "Lifestyle",
  },
];

const AS_SEEN_IN = ["Vogue Living", "Wallpaper*", "Monocle", "Apartamento", "Dezeen", "The Sunday Times", "Kinfolk", "GQ", "Elle Decoration", "Architectural Digest"];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="In the Media"
        title="Press"
        description="Editorial coverage, features, and what the world is saying about LUMYNAT."
      />

      {/* As seen in */}
      <AnimateIn animation="fade-in">
        <div className="bg-bg-subtle border-b border-border-subtle">
          <Container className="py-10">
            <p className="font-body text-[10px] tracking-[0.25em] uppercase text-text-muted text-center mb-8">As Seen In</p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
              {AS_SEEN_IN.map((pub) => (
                <span key={pub} className="font-display text-base italic text-text-faint">{pub}</span>
              ))}
            </div>
          </Container>
        </div>
      </AnimateIn>

      {/* Quotes grid */}
      <Container className="py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-8">
          {PRESS.map((item, i) => (
            <AnimateIn key={item.outlet} delay={i * 75}>
              <div className="bg-bg-subtle border border-border-subtle p-8 md:p-10 flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display text-xl font-light italic text-accent">{item.outlet}</p>
                  <span className="font-body text-[10px] tracking-widest uppercase text-text-muted shrink-0">{item.category}</span>
                </div>
                <blockquote className="font-display text-xl md:text-2xl font-light italic text-text leading-relaxed flex-1">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <p className="font-body text-[11px] text-text-muted">{item.issue}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>

      {/* Press contact */}
      <AnimateIn>
        <div className="bg-bg-dark">
          <Container className="py-16 md:py-20">
            <div className="max-w-xl mx-auto text-center">
              <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">Press Enquiries</p>
              <h2 className="font-display text-3xl font-light italic text-text-inverse mb-4">
                Working on a feature?
              </h2>
              <p className="font-body text-sm text-text-inverse/50 leading-relaxed mb-8">
                We welcome editorial requests, product loan enquiries, and interview opportunities.
                Reach out and we will respond within 48 hours.
              </p>
              <Link
                href="/contact"
                className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
              >
                Contact Press Team
              </Link>
            </div>
          </Container>
        </div>
      </AnimateIn>
    </div>
  );
}
