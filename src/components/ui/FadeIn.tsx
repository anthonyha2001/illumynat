"use client";

// ── FadeIn — passthrough (animation removed) ───────────────

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: "bottom" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

export function FadeIn({ children, className }: FadeInProps) {
  return <div className={className}>{children}</div>;
}

// ── FadeInStagger — passthrough ────────────────────────────

interface FadeInStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}

export function FadeInStagger({ children, className }: FadeInStaggerProps) {
  return <div className={className}>{children}</div>;
}

// ── FadeInItem — passthrough ───────────────────────────────

export function FadeInItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
