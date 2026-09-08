"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, {});

  return (
    <form action={formAction} className="space-y-5">

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="your@email.com"
      />

      <div className="space-y-1.5">
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className="font-body text-[11px] text-text-muted hover:text-accent transition-colors duration-200"
          >
            Forgot password?
          </a>
        </div>
      </div>

      {state?.error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-4 py-3 leading-relaxed">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
        Sign In
      </Button>
    </form>
  );
}
