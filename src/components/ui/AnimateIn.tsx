"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-in" | "scale-in";
  threshold?: number;
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  animation = "fade-up",
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        visible ? `animate-${animation}` : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
