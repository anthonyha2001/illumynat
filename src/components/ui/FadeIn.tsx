"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

// ── FadeIn ──────────────────────────────────────────────────
// Fades + slides an element in when it enters the viewport.

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: "bottom" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.65,
  from = "bottom",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const initial = {
    opacity: 0,
    y: from === "bottom" ? 28 : 0,
    x: from === "left" ? -28 : from === "right" ? 28 : 0,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── FadeInStagger ───────────────────────────────────────────
// Container that staggers children FadeInItem animations.

interface FadeInStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}

export function FadeInStagger({
  children,
  className,
  staggerDelay = 0.08,
}: FadeInStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── FadeInItem ──────────────────────────────────────────────
// Used inside FadeInStagger — inherits the parent's animate state.

export function FadeInItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
