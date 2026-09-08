import { cn } from "@/utils/cn";

interface ContainerProps {
  children: React.ReactNode;
  /** Wider max-width for editorial / hero sections */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  as?: React.ElementType;
}

const maxWidths = {
  sm:   "max-w-2xl",
  md:   "max-w-4xl",
  lg:   "max-w-6xl",
  xl:   "max-w-7xl",
  full: "max-w-none",
} as const;

export function Container({
  children,
  size = "xl",
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-6 md:px-10 lg:px-16",
        maxWidths[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
