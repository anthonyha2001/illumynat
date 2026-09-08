"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";

// ── Ritual steps data ──────────────────────────────────────
const STEPS = [
  {
    number: "01",
    heading: "The Wax",
    body:
      "We use only premium coconut-soy blends — never paraffin. A cleaner burn that carries scent further and lasts longer.",
  },
  {
    number: "02",
    heading: "The Fragrance",
    body:
      "Each scent begins as a story. Our perfumers translate emotion into accord — warm woods, cold mornings, a first breath of rain.",
  },
  {
    number: "03",
    heading: "The Pour",
    body:
      "Candles are poured by hand in small batches of twelve. Temperature is watched to the degree. There is no shortcut here.",
  },
  {
    number: "04",
    heading: "The Ritual",
    body:
      "Trim the wick. Light. Give it twenty minutes. Let the scent fill the room before you decide this is home.",
  },
];

// ── RitualSection ──────────────────────────────────────────
// A brand-story section that builds emotional resonance.
// Uses a horizontal accent line that grows in on scroll.

export function RitualSection() {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start end", "end start"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  return (
    <section className="py-28 md:py-36 bg-bg overflow-hidden">
      <Container>

        {/* Section header */}
        <FadeIn className="mb-20">
          <div className="flex flex-col items-center text-center gap-4">
            <span className="font-body text-[10px] tracking-[0.25em] uppercase text-accent">
              The craft
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-light italic text-text leading-tight max-w-lg">
              A candle is the sum<br />of every decision made.
            </h2>
            <p className="font-body text-sm text-text-muted leading-relaxed max-w-md">
              From ingredient sourcing to final inspection, nothing at
              ILLUMYNAT is left to chance. This is what we believe making
              something great actually means.
            </p>
          </div>
        </FadeIn>

        {/* Animated divider line */}
        <div ref={lineRef} className="flex justify-center mb-20">
          <motion.div
            style={{ scaleX: lineScaleX, transformOrigin: "left" }}
            className="w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
          />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {STEPS.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.1}>
              <div className="flex flex-col gap-4">
                <span className="font-display text-5xl font-light text-accent/30 leading-none">
                  {step.number}
                </span>
                <div className="w-8 h-px bg-accent/50" />
                <h3 className="font-display text-xl font-light text-text">
                  {step.heading}
                </h3>
                <p className="font-body text-sm text-text-muted leading-relaxed">
                  {step.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

      </Container>
    </section>
  );
}
