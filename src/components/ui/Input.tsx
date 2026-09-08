import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  hint?: string;
  error?: string;
  /** Renders an icon or text inside the left edge of the input */
  prefix?: React.ReactNode;
  /** Renders an icon or text inside the right edge of the input */
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-accent" aria-hidden>
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-text-muted text-sm pointer-events-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              "w-full bg-surface text-text font-body text-sm",
              "border border-border",
              "px-3 py-3",
              "placeholder:text-text-faint",
              // Transition
              "transition-colors duration-200",
              // Focus — gold ring handled globally, border changes too
              "focus:border-accent focus:outline-none",
              // Error state
              error && "border-error focus:border-error",
              // Prefix/suffix padding
              prefix && "pl-9",
              suffix && "pr-9",
              className
            )}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 text-text-muted text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {error ? (
          <p className="font-body text-[11px] text-error">{error}</p>
        ) : hint ? (
          <p className="font-body text-[11px] text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
