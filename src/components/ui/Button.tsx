"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";
import { Spinner } from "./Spinner";

// ── Variants ──────────────────────────────────────────────
const variants = {
  // Filled gold — primary call-to-action
  primary:
    "bg-accent text-text-on-gold border border-accent " +
    "hover:bg-accent-dark hover:border-accent-dark",

  // Outlined — secondary actions
  secondary:
    "bg-transparent text-text border border-border " +
    "hover:border-accent hover:text-accent",

  // Ghost — tertiary, nav links, subtle actions
  ghost:
    "bg-transparent text-text-subtle border border-transparent " +
    "hover:text-text hover:bg-bg-subtle",

  // Dark fill — CTAs on light hero sections
  dark:
    "bg-bg-dark text-text-inverse border border-bg-dark " +
    "hover:bg-bg-darker hover:border-bg-darker",

  // Destructive — delete / cancel actions
  destructive:
    "bg-transparent text-error border border-error/40 " +
    "hover:bg-error/5 hover:border-error",
} as const;

// ── Sizes ─────────────────────────────────────────────────
const sizes = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-6 py-3 text-[11px]",
  lg: "px-8 py-4 text-[12px]",
  xl: "px-10 py-5 text-[13px]",
} as const;

// ── Types ─────────────────────────────────────────────────
export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  /** When provided the button renders as a Next.js Link (no nested a>button) */
  href?: string;
}

// ── Component ─────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      href,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClass = cn(
      "relative inline-flex items-center justify-center gap-2",
      "font-body font-medium tracking-[0.12em] uppercase",
      "transition-colors duration-200",
      "select-none cursor-pointer",
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    const inner = (
      <>
        {loading && (
          <Spinner
            size="sm"
            className={
              variant === "primary" || variant === "dark"
                ? "text-text-inverse"
                : "text-text-muted"
            }
          />
        )}
        <span className={cn(loading && "opacity-0 absolute")}>{children}</span>
        {loading && <span aria-hidden>{children}</span>}
      </>
    );

    // Render as a Link when href is provided — avoids invalid a>button nesting
    if (href) {
      return (
        <Link href={href} className={baseClass} onClick={props.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
          {inner}
        </Link>
      );
    }

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className={baseClass}
        {...props}
      >
        {inner}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
