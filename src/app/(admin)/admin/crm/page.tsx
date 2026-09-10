import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { LoyaltyAdjustForm } from "./LoyaltyAdjustForm";
import AdminMessagesClient from "../messages/AdminMessagesClient";
import { ReviewActions } from "../reviews/ReviewActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — LUMYNAT Admin" };

const TIER_STYLES: Record<string, string> = {
  GOLD:   "bg-accent text-text-on-gold",
  SILVER: "bg-border-subtle text-text",
  BRONZE: "bg-bg-subtle text-text-muted",
};
const REVIEW_CLS: Record<string, string> = {
  PENDING:   "bg-warning/10 text-warning border-warning/20",
  PUBLISHED: "bg-success/10 text-success border-success/20",
  REJECTED:  "bg-error/10 text-error border-error/20",
};

const TABS = ["customers", "messages", "reviews"] as const;
type Tab = typeof TABS[number];

interface Props {
  searchParams: Promise<{ tab?: string; search?: string; tier?: string; status?: string; threadId?: string }>;
}

export default async function CRMPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params    = await searchParams;
  const tab       = (TABS.includes(params.tab as Tab) ? params.tab : "customers") as Tab;
  const search    = params.search;
  const tier      = params.tier;
  const revStatus = params.status ?? "PENDING";
  const threadId  = params.threadId;

  // ── Fetch based on active tab ────────────────────────────
  const [customers, tierCounts, totals, threads, unreadRows, activeThreadRaw, reviews, reviewCounts] =
    await Promise.all([
      tab === "customers"
        ? prisma.profile.findMany({
            where: {
              role: "CUSTOMER",
              ...(search ? { OR: [
                { email:     { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName:  { contains: search, mode: "insensitive" } },
              ]} : {}),
              ...(tier ? { loyaltyAccount: { tier: tier as "BRONZE" | "SILVER" | "GOLD" } } : {}),
            },
            select: {
              id: true, firstName: true, lastName: true, email: true, createdAt: true,
              loyaltyAccount: { select: { totalPoints: true, lifetimePoints: true, tier: true } },
              _count: { select: { orders: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : Promise.resolve([]),

      tab === "customers"
        ? prisma.loyaltyAccount.groupBy({ by: ["tier"], _count: true })
        : Promise.resolve([]),

      tab === "customers"
        ? prisma.loyaltyAccount.aggregate({ _sum: { totalPoints: true }, _count: true })
        : Promise.resolve({ _sum: { totalPoints: null }, _count: 0 }),

      tab === "messages"
        ? prisma.contactThread.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
              profile: { select: { firstName: true, lastName: true, email: true } },
              messages: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          })
        : Promise.resolve([]),

      tab === "messages"
        ? prisma.contactMessage.groupBy({
            by: ["threadId"],
            where: { fromAdmin: false, readAt: null },
            _count: { id: true },
          })
        : Promise.resolve([]),

      tab === "messages" && threadId
        ? prisma.contactThread.findUnique({
            where: { id: threadId },
            include: {
              profile: { select: { firstName: true, lastName: true, email: true } },
              messages: {
                orderBy: { createdAt: "asc" },
                include: { profile: { select: { firstName: true, lastName: true } } },
              },
            },
          })
        : Promise.resolve(null),

      tab === "reviews"
        ? prisma.productReview.findMany({
            where: revStatus === "ALL" ? undefined : { status: revStatus as never },
            orderBy: { createdAt: "desc" },
            select: {
              id: true, rating: true, title: true, body: true, status: true, createdAt: true,
              product: { select: { id: true, name: true } },
              profile: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          })
        : Promise.resolve([]),

      tab === "reviews"
        ? prisma.productReview.groupBy({ by: ["status"], _count: { _all: true } })
        : Promise.resolve([]),
    ]);

  const tierMap = Object.fromEntries((tierCounts as { tier: string; _count: number }[]).map((t) => [t.tier, t._count]));
  const unreadMap = Object.fromEntries((unreadRows as { threadId: string; _count: { id: number } }[]).map((r) => [r.threadId, r._count.id]));
  const activeThread = activeThreadRaw ? JSON.parse(JSON.stringify(activeThreadRaw)) : null;
  const threadsJson  = JSON.parse(JSON.stringify(threads));

  const reviewCountMap: Record<string, number> = {};
  (reviewCounts as { status: string; _count: { _all: number } }[]).forEach((c) => { reviewCountMap[c.status] = c._count._all; });
  const REVIEW_STATUSES = ["PENDING", "PUBLISHED", "REJECTED", "ALL"];

  function tabHref(t: Tab, extra?: string) {
    return `/admin/crm?tab=${t}${extra ?? ""}`;
  }

  return (
    <div className="p-8 max-w-[1200px]">

      {/* Header */}
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Customer Relations</p>
        <h1 className="font-display text-4xl font-light italic text-text">CRM</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8">
        {(["customers", "messages", "reviews"] as const).map((t) => {
          const labels = { customers: "Customers", messages: "Messages", reviews: "Reviews" };
          return (
            <Link
              key={t}
              href={tabHref(t)}
              className={cn(
                "px-4 py-2 font-body text-[10px] tracking-[0.14em] uppercase border transition-colors duration-150",
                tab === t
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {labels[t]}
            </Link>
          );
        })}
      </div>

      {/* ── Customers tab ── */}
      {tab === "customers" && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(["BRONZE", "SILVER", "GOLD"] as const).map((t) => (
              <div key={t} className="bg-surface border border-border-subtle p-5">
                <div className={cn("inline-block font-body text-[10px] tracking-widest uppercase px-2 py-0.5 mb-3", TIER_STYLES[t])}>
                  {t}
                </div>
                <p className="font-display text-3xl font-light text-text">{tierMap[t] ?? 0}</p>
                <p className="font-body text-xs text-text-muted mt-1">members</p>
              </div>
            ))}
          </div>

          <form method="get" className="flex gap-3 flex-wrap mb-6">
            <input type="hidden" name="tab" value="customers" />
            <input name="search" defaultValue={search} placeholder="Search by name or email…"
              className="bg-surface border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none w-64" />
            <select name="tier" defaultValue={tier ?? ""}
              className="bg-surface border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none">
              <option value="">All tiers</option>
              <option value="BRONZE">Bronze</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-accent text-text-on-gold font-body text-[11px] tracking-widest uppercase">Filter</button>
            {(search || tier) && (
              <Link href="/admin/crm?tab=customers" className="px-4 py-2 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-accent hover:text-accent transition-colors">Clear</Link>
            )}
          </form>

          <div className="bg-surface border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle">
                <tr>
                  {["Customer", "Tier", "Points", "Lifetime", "Orders", "Joined", "Adjust"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(customers as typeof customers).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-text-faint">No customers found.</td></tr>
                )}
                {(customers as typeof customers).map((c) => (
                  <tr key={c.id} className="hover:bg-bg-subtle transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="hover:text-accent transition-colors">
                        <p className="font-body text-sm text-text">{c.firstName} {c.lastName}</p>
                        <p className="font-body text-[11px] text-text-muted">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {c.loyaltyAccount
                        ? <span className={cn("font-body text-[10px] tracking-widest uppercase px-2 py-0.5", TIER_STYLES[c.loyaltyAccount.tier])}>{c.loyaltyAccount.tier}</span>
                        : <span className="font-body text-[11px] text-text-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 font-display text-base font-light text-accent">
                      {c.loyaltyAccount?.totalPoints.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {c.loyaltyAccount?.lifetimePoints.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">{c._count.orders}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <LoyaltyAdjustForm profileId={c.id} customerName={`${c.firstName} ${c.lastName}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Messages tab ── */}
      {tab === "messages" && (
        <AdminMessagesClient
          threads={threadsJson}
          unreadMap={unreadMap}
          initialThread={activeThread}
          currentUserId={user.id}
        />
      )}

      {/* ── Reviews tab ── */}
      {tab === "reviews" && (
        <>
          <div className="flex items-center gap-1 flex-wrap mb-5">
            {REVIEW_STATUSES.map((s) => {
              const count  = s === "ALL" ? Object.values(reviewCountMap).reduce((a, b) => a + b, 0) : (reviewCountMap[s] ?? 0);
              const active = (s === "ALL" && !params.status) || params.status === s || (!params.status && s === "PENDING");
              return (
                <Link
                  key={s}
                  href={tabHref("reviews", `&status=${s}`)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                    active ? "bg-accent text-text-on-gold border-accent" : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                  <span className={cn("font-body text-[9px] px-1.5 py-0.5 rounded-full", active ? "bg-text-on-gold/20" : "bg-bg-subtle")}>{count}</span>
                </Link>
              );
            })}
          </div>

          <div className="bg-surface border border-border-subtle overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  {["Product", "Customer", "Rating", "Title", "Status", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(reviews as typeof reviews).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-text-faint">No reviews found.</td></tr>
                )}
                {(reviews as typeof reviews).map((r) => (
                  <tr key={r.id} className="hover:bg-bg-subtle transition-colors">
                    <td className="px-4 py-3 font-body text-sm text-text">{r.product.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-text">{r.profile.firstName} {r.profile.lastName}</p>
                      <p className="font-body text-[11px] text-text-muted">{r.profile.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((i) => (
                          <svg key={i} className="w-3 h-3" viewBox="0 0 24 24" fill={i <= r.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}
                            style={{ color: i <= r.rating ? "var(--color-accent)" : "var(--color-border)" }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text max-w-[200px] truncate">{r.title || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("font-body text-[10px] tracking-widest uppercase border px-2 py-0.5", REVIEW_CLS[r.status] ?? "")}>
                        {r.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <ReviewActions reviewId={r.id} status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
