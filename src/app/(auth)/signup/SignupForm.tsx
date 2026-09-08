"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUp } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Client-side validation before the server action fires
        const form = e.currentTarget;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirm  = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
        if (password !== confirm) {
          e.preventDefault();
          // Can't set state directly here — show native validation
          (form.elements.namedItem("confirmPassword") as HTMLInputElement)
            .setCustomValidity("Passwords do not match.");
          form.reportValidity();
          return;
        }
        if (password.length < 8) {
          e.preventDefault();
          (form.elements.namedItem("password") as HTMLInputElement)
            .setCustomValidity("Password must be at least 8 characters.");
          form.reportValidity();
          return;
        }
        // Clear any previously set custom validity
        (form.elements.namedItem("password") as HTMLInputElement).setCustomValidity("");
        (form.elements.namedItem("confirmPassword") as HTMLInputElement).setCustomValidity("");
      }}
      className="space-y-5"
    >

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="firstName"
          type="text"
          autoComplete="given-name"
          required
          placeholder="Jane"
        />
        <Input
          label="Last name"
          name="lastName"
          type="text"
          autoComplete="family-name"
          required
          placeholder="Smith"
        />
      </div>

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="your@email.com"
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Min. 8 characters"
      />

      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Repeat your password"
      />

      {state?.error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-4 py-3 leading-relaxed">
          {state.error}
        </p>
      )}

      <p className="font-body text-[11px] text-text-faint leading-relaxed">
        By creating an account you agree to our{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-text-muted transition-colors duration-200">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-text-muted transition-colors duration-200">
          Terms of Service
        </a>.
      </p>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
        Create Account
      </Button>
    </form>
  );
}
