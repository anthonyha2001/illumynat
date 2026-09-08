import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";
import { ReviewActions } from "./ReviewActions";

export const metadata = { title: "Reviews — ILLUMYNAT Admin" };

const STATUS_CLS: Record<string, string> = {
  PENDING:   "bg-warning/10 text-warning border-warning/20",
  PUBLISHED: "bg-success/10 text-success border-success/20",
  REJECTED:  "bg-error/10 text-error border-error/20",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const [reviews, counts] = await Promise.all([
    prisma.productReview.findMany({
      where: activeStatus === "ALL" ? undefined : { status: activeStatus as never },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        createdAt: true,
        product: { select: { id: true, name: true } },
        profile: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.productReview.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  const TABS = ["PENDING", "PUBLISHED", "REJECTED", "ALL"];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Community</p>
        <h1 className="font-display text-4xl font-light italic text-text">Reviews</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap mb-6">
        {TABS.map((t) => {
          const count  = t === "ALL" ? total : (countMap[t] ?? 0);
          const active = activeStatus === t;
          return (
            <Link
              key={t}
              href={`/admin/reviews${t === "PENDING" ? "" : `?status=${t}`}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                active
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
              <span className={cn(
                "font-body text-[9px] px-1.5 py-0.5 rounded-full",
                active ? "bg-text-on-gold/20" : "bg-bg-subtle"
              )}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-surface border border-border-subtle py-16 text-center">
          <p className="font-display text-2xl font-light text-text-muted">No reviews here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface border border-border-subtle p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? "text-accent" : "text-border"}`}>★</span>
                      ))}
                    </div>
                    <span className={cn(
                      "font-body text-[10px] tracking-widest uppercase border px-2 py-0.5",
                      STATUS_CLS[review.status] ?? ""
                    )}>
                      {review.status}
                    </span>
                    <span className="font-body text-[11px] text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  {/* Title + body */}
                  {review.title && (
                    <p className="font-body text-sm font-medium text-text mb-1">{review.title}</p>
                  )}
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{review.body}</p>

                  {/* Author + product */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <Link
                      href={`/admin/customers/${review.profile.id}`}
                      className="font-body text-[11px] text-text-muted hover:text-accent transition-colors duration-150"
                    >
                      {review.profile.firstName} {review.profile.lastName}
                      <span className="text-text-faint ml-1">({review.profile.email})</span>
                    </Link>
                    <span className="text-border">·</span>
                    <Link
                      href={`/admin/products/${review.product.id}`}
                      className="font-body text-[11px] text-text-muted hover:text-accent transition-colors duration-150"
                    >
                      {review.product.name}
                    </Link>
                  </div>
                </div>

                {/* Actions */}
                <ReviewActions reviewId={review.id} status={review.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
