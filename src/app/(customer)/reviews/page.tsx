import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FadeIn } from "@/components/ui/FadeIn";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Customer Reviews — LUMYNAT",
  description: "Real reviews from real customers. See what people are saying about LUMYNAT candles.",
};

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={sz} viewBox="0 0 24 24" fill={i <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}
          style={{ color: i <= rating ? "var(--color-accent)" : "var(--color-border)" }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ count, total, star }: { count: number; total: number; star: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[11px] text-text-muted w-4 text-right">{star}</span>
      <svg className="w-3 h-3 text-accent shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <div className="flex-1 h-1.5 bg-border-subtle overflow-hidden">
        <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-body text-[11px] text-text-muted w-7">{count}</span>
    </div>
  );
}

export default async function ReviewsPage() {
  const reviews = await prisma.productReview.findMany({
    where: { status: "PUBLISHED" },
    include: {
      product: { select: { name: true, slug: true } },
      profile: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = reviews.length;
  const avg = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="Verified Purchases"
        title="Customer Reviews"
        description="Every review comes from a verified purchase. We publish all approved reviews — positive and otherwise."
      />

      {/* Summary */}
      {total > 0 && (
        <AnimateIn>
          <div className="bg-bg-subtle border-b border-border-subtle">
            <Container className="py-12 md:py-14">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-20">
                {/* Average */}
                <div className="text-center shrink-0">
                  <p className="font-display text-7xl font-light text-text">{avg.toFixed(1)}</p>
                  <StarRow rating={Math.round(avg)} size="md" />
                  <p className="font-body text-[11px] text-text-muted mt-2">{total} {total === 1 ? "review" : "reviews"}</p>
                </div>

                {/* Distribution */}
                <div className="flex-1 space-y-2 w-full max-w-sm">
                  {dist.map((d) => (
                    <RatingBar key={d.star} star={d.star} count={d.count} total={total} />
                  ))}
                </div>
              </div>
            </Container>
          </div>
        </AnimateIn>
      )}

      {/* Reviews */}
      <Container className="py-14 md:py-20">
        {total === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-3xl font-light italic text-text-muted mb-4">No reviews yet.</p>
            <p className="font-body text-sm text-text-muted mb-8">Be the first to share your experience.</p>
            <Link
              href="/shop"
              className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <AnimateIn key={review.id} delay={Math.min(i * 50, 300)}>
                <div className="bg-bg-subtle border border-border-subtle p-7 flex flex-col gap-4 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <StarRow rating={review.rating} />
                    <span className="font-body text-[10px] text-text-muted shrink-0">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {review.title && (
                    <p className="font-display text-lg font-light text-text leading-snug">{review.title}</p>
                  )}

                  <p className="font-body text-sm text-text-subtle leading-relaxed flex-1">{review.body}</p>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                    <div>
                      <p className="font-body text-[11px] font-medium text-text">
                        {review.profile.firstName ?? "Anonymous"}
                        {review.profile.lastName ? ` ${review.profile.lastName.charAt(0)}.` : ""}
                      </p>
                      <span className="font-body text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Verified purchase
                      </span>
                    </div>
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="font-body text-[10px] tracking-widest uppercase text-accent hover:underline underline-offset-2 text-right"
                    >
                      {review.product.name}
                    </Link>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        )}
      </Container>

      {/* CTA */}
      <AnimateIn>
        <div className="border-t border-border-subtle bg-bg-subtle">
          <Container className="py-14 text-center">
            <p className="font-display text-2xl font-light italic text-text mb-2">
              Ready to find your scent?
            </p>
            <p className="font-body text-sm text-text-muted mb-6">
              Purchase a candle and leave your own review after it arrives.
            </p>
            <Link
              href="/shop"
              className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
            >
              Shop Now
            </Link>
          </Container>
        </div>
      </AnimateIn>
    </div>
  );
}
