"use client";

import { useState } from "react";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/FadeIn";
import { Container } from "@/components/ui/Container";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: Date;
  profile: { firstName: string; lastName: string } | null;
}

interface ProductReviewsProps {
  reviews: Review[];
  productId: string;
  canReview: boolean;       // logged in + verified purchase + not yet reviewed
  eligibleOrderId?: string; // the orderId to attach the review to
}

// ── Star rating display ────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const s = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn(s, i < rating ? "text-accent" : "text-border")}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" />
        </svg>
      ))}
    </div>
  );
}

// ── Inline cn (avoid importing to keep component self-contained) ──
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Average rating ─────────────────────────────────────────

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-10 pb-12 border-b border-border">
      {/* Score */}
      <div className="flex flex-col items-center justify-center shrink-0 gap-2">
        <span className="font-display text-6xl font-light text-text">{avg.toFixed(1)}</span>
        <Stars rating={Math.round(avg)} size="md" />
        <span className="font-body text-xs text-text-muted">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {dist.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="font-body text-[11px] text-text-muted w-3 text-right">{star}</span>
            <div className="flex-1 h-1.5 bg-bg-subtle overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-body text-[11px] text-text-faint w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProductReviews ─────────────────────────────────────────

export function ProductReviews({ reviews, productId, canReview, eligibleOrderId }: ProductReviewsProps) {
  const [submitted, setSubmitted] = useState(false);

  const writeReviewSection = (
    <div className="mt-16 pt-12 border-t border-border">
      {submitted ? (
        <div className="max-w-lg">
          <p className="font-body text-[10px] tracking-[0.22em] uppercase text-accent mb-2">Thank You</p>
          <p className="font-display text-xl font-light text-text mb-2">Review submitted</p>
          <p className="font-body text-sm text-text-muted">
            Your review is pending approval and will appear here shortly.
          </p>
        </div>
      ) : canReview && eligibleOrderId ? (
        <div>
          <p className="font-body text-[10px] tracking-[0.22em] uppercase text-accent mb-2">Verified Purchase</p>
          <h3 className="font-display text-2xl font-light text-text mb-6">Write a Review</h3>
          <ReviewForm
            productId={productId}
            orderId={eligibleOrderId}
            onSubmitted={() => setSubmitted(true)}
          />
        </div>
      ) : null}
    </div>
  );

  if (reviews.length === 0) {
    return (
      <section className="border-t border-border py-20">
        <Container>
          <FadeIn>
            <div className={cn("flex flex-col gap-3", canReview ? "items-start" : "items-center text-center")}>
              <span className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">Reviews</span>
              <h2 className="font-display text-2xl font-light text-text">Be the first to review</h2>
              {!canReview && (
                <p className="font-body text-sm text-text-muted max-w-xs leading-relaxed">
                  Share your experience with this candle and help other customers discover their perfect scent.
                </p>
              )}
            </div>
            {writeReviewSection}
          </FadeIn>
        </Container>
      </section>
    );
  }

  return (
    <section className="border-t border-border py-20 md:py-28">
      <Container>
        <FadeIn className="mb-12">
          <span className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
            Customer reviews
          </span>
        </FadeIn>

        <FadeIn>
          <RatingSummary reviews={reviews} />
        </FadeIn>

        <FadeInStagger className="mt-12 divide-y divide-border">
          {reviews.map((review) => (
            <FadeInItem key={review.id}>
              <div className="py-8 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Stars rating={review.rating} />
                    {review.title && (
                      <h3 className="font-display text-lg font-light text-text">
                        {review.title}
                      </h3>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {review.profile && (
                      <p className="font-body text-xs text-text-subtle">
                        {review.profile.firstName} {review.profile.lastName.charAt(0)}.
                      </p>
                    )}
                    <p className="font-body text-[11px] text-text-faint">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {review.body && (
                  <p className="font-body text-sm text-text-muted leading-relaxed max-w-2xl">
                    {review.body}
                  </p>
                )}
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>

        <FadeIn>{writeReviewSection}</FadeIn>
      </Container>
    </section>
  );
}
