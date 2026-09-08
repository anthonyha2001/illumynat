import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely — resolves conflicts and
 * supports conditional class expressions via clsx.
 *
 * Usage: cn("base-class", condition && "conditional", { "object-syntax": true })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
