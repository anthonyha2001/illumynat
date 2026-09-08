import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { LoyaltyAdjustForm } from "./LoyaltyAdjustForm";

export const metadata = { title: "CRM — Admin" };

const TIER_STYLES = {
  GOLD:   "bg-accent text-text-on-gold",
  SILVER: "bg-border-subtle text-text",
  BRONZE: "bg-bg-subtle text-text-muted",
};

interface Props { searchParams: Promise<{ search?: string; tier?: string }> }

export default async function CRMPage({ searchParams }: Props) {
  const { search, tier } = await searchParams;

  const customers = await prisma.profile.findMany({
    where: {
      role: "CUSTOMER",
      ...(search ? {
        OR: [
          { email:     { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName:  { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(tier ? { loyaltyAccount: { tier: tier as "BRONZE" | "SILVER" | "GOLD" } } : {}),
    },
    select: {
      id: true, firstName: true, lastName: true, email: true, createdAt: true,
      loyaltyAccount: {
        select: { totalPoints: true, lifetimePoints: true, tier: true },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const [totals] = await Promise.all([
    prisma.loyaltyAccount.aggregate({
      _sum: { totalPoints: true },
      _count: true,
    }),
  ]);

  const tierCounts = await prisma.loyaltyAccount.groupBy({
    by: ["tier"],
    _count: true,
  });
  const tierMap = Object.fromEntries(tierCounts.map((t) => [t.tier, t._count]));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Admin</p>
          <h1 className="font-display text-3xl font-light text-text">CRM — Loyalty</h1>
        </div>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Filters */}
      <form method="get" className="flex gap-3 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="bg-surface border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none w-64"
        />
        <select
          name="tier"
          defaultValue={tier ?? ""}
          className="bg-surface border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="">All tiers</option>
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-text-on-gold font-body text-[11px] tracking-widest uppercase"
        >
          Filter
        </button>
        {(search || tier) && (
          <Link href="/admin/crm" className="px-4 py-2 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-accent hover:text-accent transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-subtle">
            <tr>
              {["Customer", "Tier", "Points", "Lifetime", "Orders", "Joined", "Adjust"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-text-faint">
                  No customers found.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-bg-subtle transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="hover:text-accent transition-colors">
                    <p className="font-body text-sm text-text">{c.firstName} {c.lastName}</p>
                    <p className="font-body text-[11px] text-text-muted">{c.email}</p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {c.loyaltyAccount ? (
                    <span className={cn("font-body text-[10px] tracking-widest uppercase px-2 py-0.5", TIER_STYLES[c.loyaltyAccount.tier])}>
                      {c.loyaltyAccount.tier}
                    </span>
                  ) : (
                    <span className="font-body text-[11px] text-text-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-display text-base font-light text-accent">
                  {c.loyaltyAccount?.totalPoints.toLocaleString() ?? "—"}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {c.loyaltyAccount?.lifetimePoints.toLocaleString() ?? "—"}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {c._count.orders}
                </td>
                <td className="px-4 py-3 font-body text-[11px] text-text-faint">
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
    </div>
  );
}
