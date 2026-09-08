"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

interface Props {
  productId: string;
  orderId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ productId, orderId, onSubmitted }: Props) {
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!body.trim())  { setError("Please write a review."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim() || null, body: body.trim(), orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const display = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Star picker */}
      <div className="space-y-1.5">
        <p className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
          Your Rating *
        </p>
        <div
          className="flex gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform duration-100 hover:scale-110"
            >
              <svg
                className={cn(
                  "w-7 h-7 transition-colors duration-100",
                  star <= display ? "text-accent" : "text-border"
                )}
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Title <span className="text-text-faint normal-case tracking-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Summarise your experience"
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Review *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          required
          placeholder="Tell us what you loved, how it burns, the scent throw…"
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
        />
      </div>

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-8 py-3 bg-text text-text-inverse font-body text-[11px] tracking-[0.15em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>

      <p className="font-body text-[11px] text-text-muted">
        Your review will be visible after a brief moderation check.
      </p>
    </form>
  );
}
