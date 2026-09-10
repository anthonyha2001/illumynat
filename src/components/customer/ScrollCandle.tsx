"use client";

import { motion, useScroll, useVelocity, useTransform, useSpring } from "framer-motion";

// Shared flame path — tall elegant teardrop, base at y=23, tip at y=5 (viewBox 0 0 20 60)
const FLAME =
  "M 10 5 C 6.5 9,5.5 15,7 20 C 8 23,10 23,10 23 C 10 23,12 23,13 20 C 14.5 15,13.5 9,10 5 Z";

interface Props {
  className?: string;
  // "accent"    — gold flame on light background (sections)
  // "watermark" — silhouette on dark background (card bg, uses currentColor)
  variant?: "accent" | "watermark";
}

// ── ScrollCandle ────────────────────────────────────────────
// The flame rotates based on global scroll velocity:
// scroll down → leans right, scroll up → leans left, stop → returns upright.
export function ScrollCandle({ className = "", variant = "accent" }: Props) {
  const { scrollY } = useScroll();
  const velocity   = useVelocity(scrollY);

  const rawRotate = useTransform(velocity, [-2200, 0, 2200], [-13, 0, 13]);
  const rotate    = useSpring(rawRotate, { stiffness: 130, damping: 24 });

  const isWatermark = variant === "watermark";

  return (
    <svg viewBox="0 0 20 60" fill="none" aria-hidden="true" className={className}>

      {/* Body */}
      <rect
        x="4.5" y="28" width="11" height="29" rx="0.5"
        fill={isWatermark ? "currentColor" : "#C4A26A"}
        fillOpacity={isWatermark ? 1 : 0.08}
        stroke={isWatermark ? "currentColor" : "#C4A26A"}
        strokeWidth="0.5"
        strokeOpacity={isWatermark ? 0.5 : 0.22}
      />

      {/* Base ledge */}
      <rect
        x="3" y="56.5" width="14" height="2" rx="0.5"
        fill={isWatermark ? "currentColor" : "#C4A26A"}
        fillOpacity={isWatermark ? 1 : 0.18}
      />

      {/* Wax pool */}
      <ellipse
        cx="10" cy="28" rx="5.5" ry="1.8"
        fill={isWatermark ? "currentColor" : "#C4A26A"}
        fillOpacity={isWatermark ? 1 : 0.22}
      />

      {/* Wick */}
      <line
        x1="10" y1="28" x2="10.5" y2="23"
        stroke={isWatermark ? "currentColor" : "#9A7840"}
        strokeWidth="0.65" strokeLinecap="round"
      />

      {/* Flame — pivots from base on scroll, flickers idle */}
      <motion.g className="flame-pivot" style={{ rotate }}>
        {/* Outer flame */}
        <path
          d={FLAME}
          fill={isWatermark ? "currentColor" : "#C4A26A"}
          fillOpacity={isWatermark ? 1 : 0.60}
          className="animate-flame flame-pivot"
        />
        {/* Bright core */}
        <ellipse
          cx="10" cy="16" rx="2" ry="3.8"
          fill={isWatermark ? "currentColor" : "#FDE68A"}
          fillOpacity={isWatermark ? 1 : 0.80}
        />
      </motion.g>
    </svg>
  );
}

// ── CandleOrnament ──────────────────────────────────────────
// Section-header ornament: thin rule — scroll candle — thin rule
// Drop-in replacement for the ✦ + lines ornament used across sections.
export function CandleOrnament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 w-36 ${className}`}>
      <div className="flex-1 h-px bg-current opacity-25" />
      <ScrollCandle className="w-[14px] h-9 flex-shrink-0" variant="accent" />
      <div className="flex-1 h-px bg-current opacity-25" />
    </div>
  );
}
