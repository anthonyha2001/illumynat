import { cn } from "@/utils/cn";

const sizes = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-2",
} as const;

interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-current border-r-transparent animate-spin",
        sizes[size],
        className
      )}
    />
  );
}
