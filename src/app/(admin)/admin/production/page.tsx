import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";

export const metadata = { title: "Production — LUMYNAT Admin" };

const BATCH_CLS: Record<string, string> = {
  PENDING:     "bg-warning/10 text-warning border-warning/20",
  IN_PROGRESS: "bg-accent/10 text-accent border-accent/20",
  COMPLETED:   "bg-success/10 text-success border-success/20",
  CANCELLED:   "bg-error/10 text-error border-error/20",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminProductionPage({ searchParams }: Props) {
  const { status } = await searchParams;

  const batches = await prisma.productionBatch.findMany({
    where: status && status !== "ALL" ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      targetQuantity: true,
      actualQuantity: true,
      totalMaterialCost: true,
      costPerUnit: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      product: { select: { id: true, name: true, sku: true } },
      recipeVersion: { select: { versionNumber: true } },
    },
  });

  const counts = await prisma.productionBatch.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  const STATUSES = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  function toNum(v: unknown): number {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseFloat(v) || 0;
    if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
      return (v as { toNumber: () => number }).toNumber();
    }
    return 0;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Manufacturing</p>
          <h1 className="font-display text-4xl font-light italic text-text">Production</h1>
        </div>
        <Link
          href="/admin/production/new"
          className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200"
        >
          + New Batch
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 flex-wrap mb-6">
        {STATUSES.map((s) => {
          const count  = s === "ALL" ? total : (countMap[s] ?? 0);
          const active = (s === "ALL" && !status) || status === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/production" : `/admin/production?status=${s}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                active
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {s === "ALL" ? "All" : s.replace("_", " ").charAt(0) + s.replace("_", " ").slice(1).toLowerCase()}
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

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Product", "Recipe v", "Target", "Actual", "Cost / Unit", "Status", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                <td className="px-4 py-3">
                  <p className="font-body text-sm font-medium text-text">{b.product.name}</p>
                  <p className="font-body text-[11px] text-text-muted">{b.product.sku}</p>
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  v{b.recipeVersion.versionNumber}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text">{b.targetQuantity}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {b.actualQuantity ?? "—"}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {b.costPerUnit ? `$${toNum(b.costPerUnit).toFixed(4)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "font-body text-[10px] tracking-widest uppercase border px-2 py-0.5",
                    BATCH_CLS[b.status] ?? ""
                  )}>
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/production/${b.id}`}
                    className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No batches found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
