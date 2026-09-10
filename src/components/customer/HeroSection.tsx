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
                "radial-gradient(ellipse 80% 80% at 70% 40%, #6b1a20 0%, #400a0f 55%, #200508 100%)",
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

      {/* ── Decorative layer ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-[2]">

        {/* ── Warm glow behind text — depth effect ── */}
        <div className="absolute left-0 top-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #C4A26A 0%, transparent 70%)" }} />

        {/* ── PRIMARY BOTANICAL — top right, tall ── */}
        <svg viewBox="0 0 100 180" fill="none"
          className="absolute -top-4 right-8 md:right-20 w-24 h-44 text-white/[0.12]">
          {/* Main stem */}
          <path d="M50 178 C52 145 58 112 65 82 C70 58 76 34 80 12 C81 7 82 3 82.5 1"
            stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          {/* Branch stems */}
          <path d="M65 84 C54 75 40 76 34 86" stroke="currentColor" strokeWidth="0.55" strokeLinecap="round" fill="none"/>
          <path d="M70 58 C80 50 93 53 94 64" stroke="currentColor" strokeWidth="0.55" strokeLinecap="round" fill="none"/>
          <path d="M62 108 C51 100 37 102 33 112" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none"/>
          <path d="M59 132 C70 125 83 129 83 140" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none"/>
          <path d="M56 154 C46 148 34 151 33 161" stroke="currentColor" strokeWidth="0.45" strokeLinecap="round" fill="none"/>
          {/* Leaves */}
          <path d="M65 82 C52 72 38 74 34 85 C48 91 64 88 65 82Z" fill="currentColor"/>
          <path d="M70 57 C80 49 93 52 94 63 C81 69 69 65 70 57Z" fill="currentColor"/>
          <path d="M62 106 C50 98 37 101 33 111 C46 117 62 113 62 106Z" fill="currentColor"/>
          <path d="M59 131 C70 124 83 128 83 139 C70 144 58 140 59 131Z" fill="currentColor"/>
          <path d="M56 153 C45 147 34 150 33 160 C45 165 55 161 56 153Z" fill="currentColor"/>
          {/* Berry tips */}
          <circle cx="82.5" cy="1" r="2.8" fill="currentColor"/>
          <circle cx="34" cy="87" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="94" cy="65" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="33" cy="113" r="1.3" fill="currentColor" opacity="0.5"/>
          <circle cx="83" cy="141" r="1.2" fill="currentColor" opacity="0.45"/>
          <circle cx="33" cy="161" r="1.1" fill="currentColor" opacity="0.4"/>
        </svg>

        {/* ── SECONDARY BOTANICAL — mid-left, ascending ── */}
        <svg viewBox="0 0 65 105" fill="none"
          className="absolute top-[30%] -left-2 md:left-6 w-12 h-20 text-white/[0.08] -rotate-12">
          <path d="M32 103 C33 80 37 58 42 38 C45 22 48 10 50 2"
            stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          <path d="M42 40 C33 33 22 35 19 43 C29 49 41 46 42 40Z" fill="currentColor"/>
          <path d="M45 23 C53 17 63 20 63 30 C52 34 44 31 45 23Z" fill="currentColor"/>
          <path d="M40 60 C31 54 20 57 18 66 C29 71 40 68 40 60Z" fill="currentColor"/>
          <path d="M38 80 C46 75 55 78 55 87 C45 91 37 88 38 80Z" fill="currentColor"/>
          <circle cx="50" cy="2" r="2" fill="currentColor"/>
          <circle cx="19" cy="44" r="1.2" fill="currentColor" opacity="0.6"/>
          <circle cx="63" cy="31" r="1.2" fill="currentColor" opacity="0.6"/>
        </svg>

        {/* ── TERTIARY BOTANICAL — bottom right, small ── */}
        <svg viewBox="0 0 55 80" fill="none"
          className="absolute bottom-14 right-6 md:right-14 w-10 h-16 text-white/[0.07] rotate-[175deg]">
          <path d="M27 78 C28 58 32 40 36 24 C38 14 41 6 42 1"
            stroke="currentColor" strokeWidth="0.7" strokeLinecap="round"/>
          <path d="M36 26 C28 20 19 22 17 29 C25 34 35 32 36 26Z" fill="currentColor"/>
          <path d="M38 14 C44 9 52 12 52 20 C44 23 37 21 38 14Z" fill="currentColor"/>
          <path d="M34 44 C26 39 17 42 16 50 C25 54 34 52 34 44Z" fill="currentColor"/>
          <circle cx="42" cy="1" r="1.8" fill="currentColor"/>
        </svg>

        {/* ── SPARKLES ✦ ── */}
        {/* Large — top left signature sparkle */}
        <svg viewBox="0 0 24 24" className="absolute top-20 left-10 md:left-20 w-7 h-7 text-white/[0.28]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Medium — upper center */}
        <svg viewBox="0 0 24 24" className="absolute top-10 left-[42%] w-4 h-4 text-white/[0.18]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Medium — left mid */}
        <svg viewBox="0 0 24 24" className="absolute top-[38%] left-8 w-4 h-4 text-white/[0.15]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Small — far left lower */}
        <svg viewBox="0 0 24 24" className="absolute top-[58%] left-5 w-3 h-3 text-white/[0.12]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Small — right mid */}
        <svg viewBox="0 0 24 24" className="absolute top-[44%] right-8 md:right-14 w-3.5 h-3.5 text-white/[0.11]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Tiny — bottom center */}
        <svg viewBox="0 0 24 24" className="absolute bottom-40 left-[48%] w-3 h-3 text-white/[0.10]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>
        {/* Tiny — upper right area */}
        <svg viewBox="0 0 24 24" className="absolute top-16 right-36 md:right-52 w-2.5 h-2.5 text-white/[0.13]">
          <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor"/>
        </svg>

        {/* ── CROSS / PLUS marks + ── */}
        <svg viewBox="0 0 12 12" className="absolute top-6 left-[58%] w-3 h-3 text-white/[0.18]">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
        <svg viewBox="0 0 12 12" className="absolute top-[25%] left-[35%] w-2.5 h-2.5 text-white/[0.12]">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
        </svg>
        <svg viewBox="0 0 12 12" className="absolute bottom-28 right-[28%] w-2.5 h-2.5 text-white/[0.10]">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
        </svg>
        <svg viewBox="0 0 12 12" className="absolute top-[68%] right-20 w-2 h-2 text-white/[0.08]">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
        </svg>

        {/* ── DOTS ── */}
        <div className="absolute top-28 left-44 w-1.5 h-1.5 rounded-full bg-white/[0.22]" />
        <div className="absolute top-14 right-40 md:right-60 w-1 h-1 rounded-full bg-white/[0.14]" />
        <div className="absolute top-[48%] left-[38%] w-1 h-1 rounded-full bg-white/[0.10]" />
        <div className="absolute bottom-52 left-20 w-1.5 h-1.5 rounded-full bg-white/[0.13]" />
        <div className="absolute bottom-20 left-[32%] w-1 h-1 rounded-full bg-white/[0.09]" />
        <div className="absolute top-[20%] right-28 w-1 h-1 rounded-full bg-white/[0.11]" />
        <div className="absolute bottom-36 right-20 w-1 h-1 rounded-full bg-white/[0.08]" />

        {/* ── CONCENTRIC RING CLUSTER — bottom right ── */}
        <svg viewBox="0 0 90 90" className="absolute bottom-20 right-6 md:right-14 w-20 h-20 text-white/[0.07]">
          <circle cx="45" cy="45" r="43" stroke="currentColor" strokeWidth="0.5" fill="none"/>
          <circle cx="45" cy="45" r="32" stroke="currentColor" strokeWidth="0.4" fill="none"/>
          <circle cx="45" cy="45" r="20" stroke="currentColor" strokeWidth="0.35" fill="none"/>
          <circle cx="45" cy="45" r="8" stroke="currentColor" strokeWidth="0.3" fill="none"/>
        </svg>

        {/* ── Small ring — upper right ── */}
        <svg viewBox="0 0 40 40" className="absolute top-8 right-28 md:right-40 w-8 h-8 text-white/[0.06]">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.5" fill="none"/>
          <circle cx="20" cy="20" r="11" stroke="currentColor" strokeWidth="0.35" fill="none"/>
        </svg>

        {/* ── Thin horizontal rule — frames content below ── */}
        <div className="absolute left-0 bottom-[36%] md:bottom-[40%] w-1/3 h-px
          bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

      </div>

      {/* ── Content ── */}
      <Container className="relative z-10 h-full flex items-end pb-24 md:items-center md:pb-0">
        <motion.div style={{ y: textY }} className="max-w-xl w-full">

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="font-body text-[11px] tracking-[0.25em] uppercase text-gold mb-4 md:mb-6"
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
            <span className="not-italic font-light text-gold">{content.headlineAccent}</span>
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
