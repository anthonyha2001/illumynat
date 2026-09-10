"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/FadeIn";
import { ScrollCandle, CandleOrnament } from "@/components/customer/ScrollCandle";

const EASE = [0.16, 1, 0.3, 1] as const;

const FAMILIES = [
  {
    id: "woody",
    label: "Woody",
    description: "Sandalwood, vetiver, cedar — grounding and warm.",
    href: "/shop?scent=woody",
    bg: "bg-[#6b4c2a]",
    accent: "bg-[#c49a6c]",
  },
  {
    id: "floral",
    label: "Floral",
    description: "Rose, jasmine, peony — soft and intimate.",
    href: "/shop?scent=floral",
    bg: "bg-[#7a4f5b]",
    accent: "bg-[#d4a0af]",
  },
  {
    id: "fresh",
    label: "Fresh",
    description: "Sea salt, green tea, citrus — bright and clean.",
    href: "/shop?scent=fresh",
    bg: "bg-[#2c5264]",
    accent: "bg-[#7bbacf]",
  },
  {
    id: "spiced",
    label: "Spiced",
    description: "Cinnamon, clove, cardamom — festive and deep.",
    href: "/shop?scent=spiced",
    bg: "bg-[#5a3020]",
    accent: "bg-[#b87040]",
  },
  {
    id: "earthy",
    label: "Earthy",
    description: "Patchouli, oakmoss, damp soil — raw and elemental.",
    href: "/shop?scent=earthy",
    bg: "bg-[#3b4232]",
    accent: "bg-[#8a9870]",
  },
  {
    id: "aquatic",
    label: "Aquatic",
    description: "Rain water, white musk, mist — serene and minimal.",
    href: "/shop?scent=aquatic",
    bg: "bg-[#2a3d52]",
    accent: "bg-[#6a9bb8]",
  },
];

export function ScentFamilySection() {
  return (
    <section className="py-28 md:py-36 bg-bg-subtle overflow-hidden relative">

      <Container>
        <FadeIn className="flex flex-col items-center text-center gap-3 mb-16">
          <CandleOrnament className="text-accent" />
          <span className="font-body text-[10px] tracking-[0.28em] uppercase text-accent">
            Explore by mood
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-text leading-tight">
            Find your scent family
          </h2>
          <p className="font-body text-sm text-text-muted leading-relaxed max-w-sm">
            Every scent tells a different story. Start with how you want to feel.
          </p>
        </FadeIn>

        <FadeInStagger className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {FAMILIES.map((family) => (
            <FadeInItem key={family.id}>
              <Link href={family.href} className="group block">
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`
                    relative overflow-hidden
                    aspect-[4/5] flex flex-col justify-end
                    ${family.bg}
                    scent-card-border
                  `}
                >
                  {/* Accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] ${family.accent}
                      opacity-60 group-hover:opacity-100 transition-opacity duration-400`}
                  />

                  {/* Candle watermark — ghosted, centered */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none">
                    <ScrollCandle
                      className="w-10 h-28 text-white/[0.05] group-hover:text-white/[0.09] transition-colors duration-500"
                      variant="watermark"
                    />
                  </div>

                  {/* Inner gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  {/* Hover tint */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-400" />

                  {/* Content */}
                  <div className="relative z-10 p-5 md:p-7">
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-white/45 mb-1.5">
                      Scent family
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl font-light text-white leading-tight mb-2">
                      {family.label}
                    </h3>
                    <p className="font-body text-xs text-white/55 leading-relaxed">
                      {family.description}
                    </p>

                    {/* Explore arrow */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="mt-4 flex items-center gap-2 text-white/75 text-[11px] tracking-[0.15em] uppercase font-body"
                    >
                      Explore
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
