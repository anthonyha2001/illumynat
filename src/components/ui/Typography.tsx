import { cn } from "@/utils/cn";

// ── Display — Cormorant Garamond serif, for hero and product names ──

interface DisplayProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  italic?: boolean;
  className?: string;
}

const displaySizes = {
  xs:  "text-2xl md:text-3xl",
  sm:  "text-3xl md:text-4xl",
  md:  "text-4xl md:text-5xl",
  lg:  "text-5xl md:text-6xl",
  xl:  "text-6xl md:text-7xl",
  "2xl":"text-7xl md:text-8xl",
} as const;

export function Display({
  children,
  as: Tag = "h2",
  size = "md",
  italic = false,
  className,
}: DisplayProps) {
  return (
    <Tag
      className={cn(
        "font-display font-light leading-[1.1] tracking-[-0.01em] text-text",
        displaySizes[size],
        italic && "italic",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ── Label — uppercase tracking, for section labels and eyebrows ──

interface LabelProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  muted?: boolean;
  accent?: boolean;
}

export function Label({
  children,
  as: Tag = "span",
  muted = false,
  accent = false,
  className,
}: LabelProps) {
  return (
    <Tag
      className={cn(
        "font-body text-[11px] font-medium tracking-[0.18em] uppercase",
        muted ? "text-text-muted" : accent ? "text-accent" : "text-text-subtle",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ── Body — Inter sans-serif, for descriptions and UI text ──

interface BodyProps {
  children: React.ReactNode;
  as?: React.ElementType;
  size?: "xs" | "sm" | "md" | "lg";
  muted?: boolean;
  className?: string;
}

const bodySizes = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

export function Body({
  children,
  as: Tag = "p",
  size = "md",
  muted = false,
  className,
}: BodyProps) {
  return (
    <Tag
      className={cn(
        "font-body font-light leading-relaxed",
        bodySizes[size],
        muted ? "text-text-muted" : "text-text-subtle",
        className
      )}
    >
      {children}
    </Tag>
  );
}
