"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { HeroContent } from "@/lib/data/siteContent";
import { HERO_DEFAULTS } from "@/lib/data/siteContent";

// ── HeroSection ────────────────────────────────────────────
// Full-viewport opening statement with parallax scroll effect
// and a split layout (editorial text left, atmospheric image right)

export function HeroSection({ content = HERO_DEFAULTS }: { content?: HeroContent }) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax layers
  const imageY     = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textY      = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const overlayO   = useTransform(scrollYProgress, [0, 0.6], [0.35, 0.55]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen min-h-[600px] overflow-hidden bg-bg-dark"
    >
      {/* ── Background with parallax ── */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 scale-[1.15] origin-top"
      >
        {content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt="Hero background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 70% 40%, #3d2e1e 0%, #1a1108 60%, #0a0804 100%)",
            }}
          />
        )}
        {/* Subtle warm noise texture overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />
      </motion.div>

      {/* ── Gradient vignette ── */}
      <motion.div
        style={{ opacity: overlayO }}
        className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/60 to-transparent"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent" />

      {/* ── Content ── */}
      <Container className="relative z-10 h-full flex items-end pb-24 md:items-center md:pb-0">
        <motion.div style={{ y: textY }} className="max-w-xl w-full">

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4 md:mb-6"
          >
            {content.eyebrow}
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light italic leading-[1.05] text-text-inverse mb-4 md:mb-6"
          >
            {content.headline}<br />
            <span className="not-italic font-light text-accent">{content.headlineAccent}</span>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="font-body text-sm text-text-inverse/60 leading-relaxed max-w-sm mb-8 md:mb-10 hidden sm:block"
          >
            {content.subCopy}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex items-center gap-6"
          >
            <Button href={content.primaryCtaHref} variant="primary" size="lg">{content.primaryCtaLabel}</Button>
            <Link
              href={content.secondaryCtaHref}
              className="font-body text-[11px] tracking-[0.2em] uppercase text-text-inverse/50 hover:text-text-inverse/90 transition-colors duration-200"
            >
              {content.secondaryCtaLabel}
            </Link>
          </motion.div>
        </motion.div>
      </Container>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-inverse/30"
      >
        <span className="font-body text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-text-inverse/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}
