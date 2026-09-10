"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const TOPICS = [
  "Order question",
  "Return or exchange",
  "Product question",
  "Corporate gifting",
  "Press enquiry",
  "Other",
];

interface Props {
  profile: { firstName: string; lastName: string; email: string } | null;
}

export default function ContactForm({ profile }: Props) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!profile;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const name = isLoggedIn
      ? `${profile.firstName} ${profile.lastName}`
      : `${fd.get("firstName")} ${fd.get("lastName")}`.trim();
    const email = isLoggedIn ? profile.email : (fd.get("email") as string);

    const payload = {
      name,
      email,
      subject: (fd.get("topic") as string) || "General inquiry",
      topic:   fd.get("topic") as string,
      body:    fd.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setThreadId(data.threadId);
      setSubmitted(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {submitted ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-pale flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-light italic text-text mb-3">Message sent.</h2>
          <p className="font-body text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
            Thank you for reaching out. We will get back to you within 24 hours.
            {isLoggedIn && " You can follow this conversation in your account."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {threadId && isLoggedIn && (
              <Button variant="primary" onClick={() => router.push(`/account/messages/${threadId}`)}>
                View conversation
              </Button>
            )}
            <button
              onClick={() => { setSubmitted(false); setThreadId(null); }}
              className="font-body text-[11px] tracking-widest uppercase text-accent hover:underline underline-offset-2"
            >
              Send another message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Identity — only shown to guests */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border-subtle">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="font-display text-sm font-light text-text-on-gold">
                  {profile.firstName[0]}
                </span>
              </div>
              <div>
                <p className="font-body text-sm text-text">{profile.firstName} {profile.lastName}</p>
                <p className="font-body text-[11px] text-text-muted">{profile.email}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">First name</label>
                  <Input name="firstName" type="text" required placeholder="Jane" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Last name</label>
                  <Input name="lastName" type="text" required placeholder="Smith" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Email</label>
                <Input name="email" type="email" required placeholder="jane@example.com" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Topic</label>
            <select
              name="topic"
              required
              defaultValue=""
              className="w-full h-11 border border-border-subtle bg-surface px-3 font-body text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="" disabled>Select a topic</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full border border-border-subtle bg-surface px-3 py-3 font-body text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {error && <p className="font-body text-sm text-error">{error}</p>}

          <Button variant="primary" size="lg" type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send Message"}
          </Button>
        </form>
      )}
    </div>
  );
}
