import { cn } from "@/utils/cn";

interface DividerProps {
  /** Optional label centered in the divider */
  label?: string;
  /** Gold accent line vs standard border */
  accent?: boolean;
  className?: string;
}

export function Divider({ label, accent = false, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <span
          className={cn(
            "flex-1 h-px",
            accent ? "bg-accent/40" : "bg-border-subtle"
          )}
        />
        <span className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted shrink-0">
          {label}
        </span>
        <span
          className={cn(
            "flex-1 h-px",
            accent ? "bg-accent/40" : "bg-border-subtle"
          )}
        />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        "border-0 h-px",
        accent ? "bg-accent/30" : "bg-border-subtle",
        className
      )}
    />
  );
}
