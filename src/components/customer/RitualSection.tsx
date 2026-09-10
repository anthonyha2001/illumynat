"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { ScrollCandle, CandleOrnament } from "@/components/customer/ScrollCandle";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

const STEPS = [
  {
    number: "01",
    heading: "The Wax",
    body: "We use only premium coconut-soy blends — never paraffin. A cleaner burn that carries scent further and lasts longer.",
  },
  {
    number: "02",
    heading: "The Fragrance",
    body: "Each scent begins as a story. Our perfumers translate emotion into accord — warm woods, cold mornings, a first breath of rain.",
  },
  {
    number: "03",
    heading: "The Pour",
    body: "Candles are poured by hand in small batches of twelve. Temperature is watched to the degree. There is no shortcut here.",
  },
  {
    number: "04",
    heading: "The Ritual",
    body: "Trim the wick. Light. Give it twenty minutes. Let the scent fill the room before you decide this is home.",
  },
];

export function RitualSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef    = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start end", "end start"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  return (
    <section ref={sectionRef} className="relative py-28 md:py-36 bg-bg overflow-hidden">

      {/* Decorative candle — right side */}
      <div
        aria-hidden="true"
        className="absolute top-12 right-6 md:right-14 lg:right-20
                   pointer-events-none select-none hidden md:block"
      >
        <ScrollCandle className="w-10 h-28 text-accent/[0.16]" variant="accent" />
      </div>

      <Container className="relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-20"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <CandleOrnament className="text-accent" />
            <span className="font-body text-[10px] tracking-[0.28em] uppercase text-accent">
              The craft
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-light italic text-text leading-tight max-w-lg">
              A candle is the sum<br />of every decision made.
            </h2>
            <p className="font-body text-sm text-text-subtle leading-relaxed max-w-md">
              From ingredient sourcing to final inspection, nothing at
              MAISON is left to chance. This is what we believe making
              something great actually means.
            </p>
          </div>
        </motion.div>

        {/* Animated divider */}
        <div ref={lineRef} className="flex justify-center mb-20">
          <motion.div
            style={{ scaleX: lineScaleX, transformOrigin: "left" }}
            className="w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent"
          />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: EASE }}
            >
              <div className="flex flex-col gap-4">
                {/* Step number */}
                <span className="font-display text-5xl font-light text-gold/65 leading-none">
                  {step.number}
                </span>

                {/* Decorative rule */}
                <div className="w-7 h-px bg-gold/50" />

                <h3 className="font-display text-xl font-light text-text">
                  {step.heading}
                </h3>
                <p className="font-body text-sm text-text-subtle leading-relaxed">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
