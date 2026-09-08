import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/utils/cn";

export const metadata = { title: "Gift Cards — ILLUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminGiftCardsPage({ searchParams }: Props) {
  const { q, status } = await searchParams;

  const activeFilter = status ?? "all";

  const where = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" as const } },
            { issuedToEmail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(activeFilter === "active"
      ? { isActive: true, currentBalance: { gt: 0 } }
      : activeFilter === "depleted"
      ? { currentBalance: { lte: 0 } }
      : activeFilter === "inactive"
      ? { isActive: false }
      : {}),
  };

  const giftCards = await prisma.giftCard.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      issuedToProfile: { select: { firstName: true, lastName: true } },
      _count: { select: { transactions: true } },
    },
  });

  // Summary stats (all time)
  const [totalIssued, totalActive, totalValue] = await Promise.all([
    prisma.giftCard.count(),
    prisma.giftCard.count({ where: { isActive: true, currentBalance: { gt: 0 } } }),
    prisma.giftCard.aggregate({ _sum: { currentBalance: true } }),
  ]);

  const FILTERS = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "depleted", label: "Depleted" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Finance</p>
          <h1 className="font-display text-4xl font-light italic text-text">Gift Cards</h1>
        </div>
        <Link
          href="/admin/gift-cards/new"
          className="px-5 py-2.5 bg-text text-text-inverse font-body text-[11px] tracking-[0.12em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
        >
          Issue Gift Card
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Issued",    value: totalIssued.toString() },
          { label: "Active Cards",    value: totalActive.toString() },
          { label: "Outstanding Liability", value: fmt(toNum(totalValue._sum.currentBalance)) },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border-subtle p-5">
            <p className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted mb-2">{card.label}</p>
            <p className="font-display text-3xl font-light text-text">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/gift-cards?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                activeFilter === f.key
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form method="GET" action="/admin/gift-cards" className="flex-1 flex gap-2 max-w-sm">
          {activeFilter !== "all" && <input type="hidden" name="status" value={activeFilter} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search code or email…"
            className="flex-1 bg-surface border border-border px-3 py-1.5 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-text text-text-inverse font-body text-[11px] tracking-[0.1em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Code", "Issued To", "Initial", "Balance", "Expires", "Txns", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.12em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {giftCards.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center font-body text-sm text-text-muted">
                  No gift cards found.
                </td>
              </tr>
            ) : (
              giftCards.map((gc) => {
                const initial  = toNum(gc.initialBalance);
                const balance  = toNum(gc.currentBalance);
                const pctLeft  = initial > 0 ? (balance / initial) * 100 : 0;
                const isExpired = gc.expiresAt ? gc.expiresAt < new Date() : false;
                const isDepleted = balance <= 0;

                const statusLabel = !gc.isActive
                  ? { label: "Inactive", cls: "bg-border/40 text-text-muted" }
                  : isExpired
                  ? { label: "Expired",  cls: "bg-warning/10 text-warning" }
                  : isDepleted
                  ? { label: "Depleted", cls: "bg-border/40 text-text-muted" }
                  : { label: "Active",   cls: "bg-success/10 text-success" };

                return (
                  <tr key={gc.id} className="group hover:bg-bg-subtle transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-text tracking-widest">{gc.code}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {gc.issuedToProfile
                        ? `${gc.issuedToProfile.firstName} ${gc.issuedToProfile.lastName}`
                        : gc.issuedToEmail ?? <span className="text-text-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text">{fmt(initial)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="font-body text-sm text-text">{fmt(balance)}</span>
                        <div className="w-16 h-1 bg-bg-subtle overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: `${pctLeft}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-[11px] text-text-muted">
                      {gc.expiresAt
                        ? gc.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : <span className="text-text-faint">Never</span>}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted text-center">
                      {gc._count.transactions}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 font-body text-[10px] tracking-[0.08em] uppercase", statusLabel.cls)}>
                        {statusLabel.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/gift-cards/${gc.id}`}
                        className="font-body text-[11px] tracking-[0.08em] uppercase text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent transition-all duration-150"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
