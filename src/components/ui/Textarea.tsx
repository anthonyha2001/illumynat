import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Show a character counter — requires maxLength prop */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, error, showCount, className, id, value, maxLength, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
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
            {showCount && maxLength && (
              <span className="font-body text-[11px] text-text-muted">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full bg-surface text-text font-body text-sm",
            "border border-border",
            "px-3 py-3",
            "placeholder:text-text-faint",
            "resize-none",
            "transition-colors duration-200",
            "focus:border-accent focus:outline-none",
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="font-body text-[11px] text-error">{error}</p>
        ) : hint ? (
          <p className="font-body text-[11px] text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
