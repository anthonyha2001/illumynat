import { cn } from "@/utils/cn";

// ── Variants ──────────────────────────────────────────────
const variants = {
  // Storefront product signals
  new:       "bg-bg-dark text-text-inverse",
  bestseller:"bg-accent text-text-on-gold",
  limited:   "bg-bg-dark text-accent border border-accent/30",
  lowstock:  "bg-warning/10 text-warning border border-warning/20",
  soldout:   "bg-bg-muted text-text-muted",
  sale:      "bg-error/10 text-error border border-error/20",

  // General purpose
  default:   "bg-bg-subtle text-text-subtle border border-border",
  accent:    "bg-accent-pale text-text border border-accent-light",
  success:   "bg-success/10 text-success border border-success/20",
} as const;

export interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "font-body text-[10px] font-medium tracking-[0.12em] uppercase",
        "px-2.5 py-1",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
