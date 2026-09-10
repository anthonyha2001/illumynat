"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-body text-sm text-accent leading-relaxed">
        ✓ You&apos;re in. Welcome to the LUMYNAT Circle.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-text-inverse/5 border-text-inverse/15 text-text-inverse placeholder:text-text-inverse/30 focus:border-accent"
        aria-label="Email for newsletter"
        required
      />
      <Button variant="primary" size="md" type="submit" loading={state === "loading"}>
        Join
      </Button>
      {state === "error" && (
        <p className="font-body text-xs text-error mt-1">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
