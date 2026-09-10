import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";

export const metadata = { title: "Lab — LUMYNAT Admin" };

// ── helpers ─────────────────────────────────────────────────
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return 0;
}

const STATUS_CLS: Record<string, string> = {
  ACTIVE:      "bg-success/10 text-success border-success/20",
  DRAFT:       "bg-warning/10 text-warning border-warning/20",
  ARCHIVED:    "bg-bg-subtle text-text-muted border-border",
  IN_PROGRESS: "bg-accent/10 text-accent border-accent/20",
  PENDING:     "bg-warning/10 text-warning border-warning/20",
  COMPLETED:   "bg-success/10 text-success border-success/20",
  CANCELLED:   "bg-error/10 text-error border-error/20",
};

const TABS = ["recipes", "products", "production"] as const;
type Tab = typeof TABS[number];

interface Props {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function LabPage({ searchParams }: Props) {
  const params  = await searchParams;
  const tab     = (TABS.includes(params.tab as Tab) ? params.tab : "recipes") as Tab;
  const bStatus = params.status;

  // ── Fetch based on active tab ────────────────────────────
  const [products, batches] = await Promise.all([
    tab === "products" || tab === "recipes"
      ? prisma.product.findMany({
          where:   tab === "products" ? undefined : { status: { not: "ARCHIVED" } },
          orderBy: tab === "products" ? { createdAt: "desc" } : { name: "asc" },
          select: {
            id: true, sku: true, name: true, status: true, price: true,
            scentFamily: true,
            category:      { select: { name: true } },
            images:        { where: { isPrimary: true }, take: 1, select: { url: true } },
            finishedGoods: { select: { quantityOnHand: true } },
            _count:        { select: { orderItems: true } },
            recipe: {
              select: {
                versions: {
                  orderBy: { versionNumber: "desc" },
                  take: 1,
                  select: { versionNumber: true, status: true, _count: { select: { ingredients: true } } },
                },
              },
            },
          },
        })
      : Promise.resolve([]),

    tab === "production"
      ? prisma.productionBatch.findMany({
          where:   bStatus && bStatus !== "ALL" ? { status: bStatus as never } : undefined,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, status: true, targetQuantity: true,
            actualQuantity: true, costPerUnit: true, createdAt: true,
            product:       { select: { id: true, name: true, sku: true } },
            recipeVersion: { select: { versionNumber: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  // Batch status counts for filter pills
  const batchCounts = tab === "production"
    ? await prisma.productionBatch.groupBy({ by: ["status"], _count: { _all: true } })
    : [];
  const countMap: Record<string, number> = {};
  batchCounts.forEach((c) => { countMap[c.status] = c._count._all; });
  const batchTotal = Object.values(countMap).reduce((a, b) => a + b, 0);

  const BATCH_STATUSES = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div className="p-8 max-w-[1200px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Manufacturing</p>
          <h1 className="font-display text-4xl font-light italic text-text">The Lab</h1>
        </div>

        {tab === "production" && (
          <Link href="/admin/production/new"
            className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity">
            + New Batch
          </Link>
        )}
        {tab === "products" && (
          <Link href="/admin/products/new"
            className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity">
            + New Product
          </Link>
        )}
      </div>

      {/* ── Workflow breadcrumb ── */}
      <div className="flex items-center gap-2 mb-6">
        {(["recipes", "products", "production"] as const).map((t, i) => {
          const labels = { recipes: "1. Recipes", products: "2. Products", production: "3. Production" };
          return (
            <div key={t} className="flex items-center gap-2">
              {i > 0 && <span className="text-text-faint text-xs">→</span>}
              <Link
                href={`/admin/lab?tab=${t}`}
                className={cn(
                  "font-body text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors duration-150",
                  tab === t
                    ? "bg-accent text-text-on-gold border-accent"
                    : "text-text-muted border-border hover:border-accent hover:text-accent bg-surface"
                )}
              >
                {labels[t]}
              </Link>
            </div>
          );
        })}
        <p className="ml-4 font-body text-[11px] text-text-faint">
          {tab === "recipes"    && "Create or manage a recipe for each product."}
          {tab === "products"   && "Product doesn't exist yet? Create it here, then add its recipe."}
          {tab === "production" && "Select a product + recipe version to start a production batch."}
        </p>
      </div>

      {/* ── Recipes tab ── */}
      {tab === "recipes" && (
        <div className="bg-surface border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Product", "SKU", "Latest Version", "Ingredients", "Recipe Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(products as typeof products).map((p) => {
                const latest    = p.recipe?.versions[0];
                const hasRecipe = !!latest;
                return (
                  <tr key={p.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                    <td className="px-4 py-3 font-body text-sm font-medium text-text">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-muted">{p.sku}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">{hasRecipe ? `v${latest.versionNumber}` : "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted text-center">{hasRecipe ? latest._count.ingredients : "—"}</td>
                    <td className="px-4 py-3">
                      {!hasRecipe ? (
                        <span className="font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 bg-bg-subtle text-text-muted border-border">No Recipe</span>
                      ) : (
                        <span className={cn("font-body text-[10px] tracking-widest uppercase border px-2 py-0.5", STATUS_CLS[latest.status] ?? "")}>
                          {latest.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/recipes/${p.id}`}
                        className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      >
                        {hasRecipe ? "Manage →" : "Create Recipe →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-light text-text-muted">No products found.</p>
              <Link href="/admin/lab?tab=products" className="mt-3 inline-block font-body text-sm text-accent hover:underline">
                Create a product first →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Products tab ── */}
      {tab === "products" && (
        <>
          <div className="flex gap-6 mb-4 font-body text-sm text-text-muted">
            <span>{(products as typeof products).filter(p => p.status === "ACTIVE").length} active</span>
            <span>{(products as typeof products).filter(p => p.status === "DRAFT").length} draft</span>
            <span>{(products as typeof products).filter(p => p.status === "ARCHIVED").length} archived</span>
          </div>
          <div className="bg-surface border border-border-subtle overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  {["Product", "SKU", "Category", "Price", "Stock", "Sales", "Recipe", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(products as typeof products).map((p) => {
                  const qty       = p.finishedGoods?.quantityOnHand ?? null;
                  const hasRecipe = !!p.recipe?.versions[0];
                  return (
                    <tr key={p.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images[0]?.url
                            ? <img src={p.images[0].url} alt={p.name} className="w-9 h-11 object-cover bg-bg-subtle shrink-0" />
                            : <div className="w-9 h-11 bg-bg-subtle flex items-center justify-center shrink-0"><span className="font-display text-base italic text-text-faint">L</span></div>
                          }
                          <div>
                            <p className="font-body text-sm text-text">{p.name}</p>
                            {p.scentFamily && <p className="font-body text-[10px] text-text-muted">{p.scentFamily}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted">{p.sku}</td>
                      <td className="px-4 py-3 font-body text-sm text-text-subtle">{p.category.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-text">${toNum(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3 font-body text-sm font-medium" style={{ color: qty === null ? "var(--color-text-muted)" : qty === 0 ? "var(--color-error)" : qty <= 5 ? "var(--color-warning)" : "var(--color-text)" }}>
                        {qty === null ? "—" : qty}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-text-muted">{p._count.orderItems}</td>
                      <td className="px-4 py-3">
                        {hasRecipe
                          ? <Link href={`/admin/recipes/${p.id}`} className="font-body text-[10px] tracking-widest uppercase text-accent hover:underline underline-offset-2">View →</Link>
                          : <Link href={`/admin/lab?tab=recipes`} className="font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors">Add recipe</Link>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-body text-[10px] tracking-widest uppercase border px-2 py-0.5", STATUS_CLS[p.status] ?? "")}>
                          {p.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`}
                          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100">
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-display text-2xl font-light text-text-muted">No products yet.</p>
                <Link href="/admin/products/new" className="mt-3 inline-block font-body text-sm text-accent hover:underline">Create your first product →</Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Production tab ── */}
      {tab === "production" && (
        <>
          <div className="flex items-center gap-1 flex-wrap mb-5">
            {BATCH_STATUSES.map((s) => {
              const count  = s === "ALL" ? batchTotal : (countMap[s] ?? 0);
              const active = (s === "ALL" && !bStatus) || bStatus === s;
              return (
                <Link
                  key={s}
                  href={s === "ALL" ? "/admin/lab?tab=production" : `/admin/lab?tab=production&status=${s}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                    active ? "bg-accent text-text-on-gold border-accent" : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
                  )}
                >
                  {s === "ALL" ? "All" : s.replace("_", " ").charAt(0) + s.replace("_", " ").slice(1).toLowerCase()}
                  <span className={cn("font-body text-[9px] px-1.5 py-0.5 rounded-full", active ? "bg-text-on-gold/20" : "bg-bg-subtle")}>
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
                    <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">{h}</th>
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
                    <td className="px-4 py-3 font-body text-sm text-text-muted">v{b.recipeVersion.versionNumber}</td>
                    <td className="px-4 py-3 font-body text-sm text-text">{b.targetQuantity}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">{b.actualQuantity ?? "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {b.costPerUnit ? `$${toNum(b.costPerUnit).toFixed(4)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("font-body text-[10px] tracking-widest uppercase border px-2 py-0.5", STATUS_CLS[b.status] ?? "")}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/production/${b.id}`}
                        className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100">
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
                <Link href="/admin/production/new" className="mt-3 inline-block font-body text-sm text-accent hover:underline">Start a new batch →</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
