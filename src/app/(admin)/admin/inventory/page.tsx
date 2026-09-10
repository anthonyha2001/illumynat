import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";

export const metadata = { title: "Inventory — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminInventoryPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "materials" ? "materials" : "finished";

  const [finishedGoods, rawMaterials] = await Promise.all([
    prisma.finishedGoods.findMany({
      orderBy: { product: { name: "asc" } },
      select: {
        id: true,
        quantityOnHand: true,
        averageCost: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            status: true,
            price: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            recipe: {
              select: {
                versions: {
                  orderBy: { versionNumber: "desc" },
                  select: {
                    status: true,
                    yieldQuantity: true,
                    ingredients: {
                      select: {
                        quantity: true,
                        rawMaterial: { select: { averageCost: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        currentStock: true,
        reorderThreshold: true,
        averageCost: true,
        consumptionUnit: true,
        updatedAt: true,
      },
    }),
  ]);

  function recipeUnitCost(fg: typeof finishedGoods[number]): number | null {
    const versions = fg.product.recipe?.versions ?? [];
    if (versions.length === 0) return null;
    // Prefer ACTIVE version, fall back to latest by versionNumber
    const version = versions.find((v) => v.status === "ACTIVE") ?? versions[0];
    if (!version || version.ingredients.length === 0) return null;
    const batchCost = version.ingredients.reduce(
      (sum, ing) => sum + toNum(ing.quantity) * toNum(ing.rawMaterial.averageCost),
      0
    );
    return batchCost / (version.yieldQuantity || 1);
  }

  const totalFinishedValue = finishedGoods.reduce(
    (sum, fg) => sum + toNum(fg.quantityOnHand) * toNum(fg.averageCost),
    0
  );
  const lowStockCount   = finishedGoods.filter((fg) => fg.quantityOnHand <= 5).length;
  const outOfStockCount = finishedGoods.filter((fg) => fg.quantityOnHand === 0).length;

  const totalEstimatedProfit = finishedGoods.reduce((sum, fg) => {
    const cost   = recipeUnitCost(fg);
    const price  = toNum(fg.product.price);
    const qty    = fg.quantityOnHand;
    if (cost === null || price === 0) return sum;
    return sum + (price - cost) * qty;
  }, 0);

  const totalMaterialValue = rawMaterials.reduce(
    (sum, rm) => sum + toNum(rm.currentStock) * toNum(rm.averageCost),
    0
  );
  const belowReorderCount = rawMaterials.filter(
    (rm) => toNum(rm.currentStock) <= toNum(rm.reorderThreshold)
  ).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Stock</p>
          <h1 className="font-display text-4xl font-light italic text-text">Inventory</h1>
        </div>
        {activeTab === "materials" && (
          <div className="flex gap-2">
            <Link
              href="/admin/inventory/stock-in"
              className="px-5 py-2.5 bg-text text-text-inverse font-body text-[11px] tracking-[0.15em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
            >
              Receive Stock
            </Link>
            <Link
              href="/admin/inventory/materials/new"
              className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200"
            >
              + New Material
            </Link>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Finished Goods Value",    value: `$${totalFinishedValue.toFixed(2)}` },
          { label: "Est. Total Profit",        value: `$${totalEstimatedProfit.toFixed(2)}`, accent: true },
          { label: "Out of Stock",             value: outOfStockCount,  danger: outOfStockCount > 0 },
          { label: "Materials Below Reorder",  value: belowReorderCount, warn: belowReorderCount > 0 },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border-subtle p-5">
            <p className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted mb-2">{card.label}</p>
            <p className={cn(
              "font-display text-3xl font-light",
              card.danger ? "text-error" : card.warn ? "text-warning" : card.accent ? "text-accent" : "text-text"
            )}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(["finished", "materials"] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/inventory${t === "finished" ? "" : "?tab=materials"}`}
            className={cn(
              "px-4 py-2 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
              activeTab === t
                ? "bg-accent text-text-on-gold border-accent"
                : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
            )}
          >
            {t === "finished" ? "Finished Goods" : "Raw Materials"}
          </Link>
        ))}
      </div>

      {/* Finished Goods tab */}
      {activeTab === "finished" && (
        <div className="bg-surface border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Product", "SKU", "On Hand", "Recipe Cost", "Sell Price", "Profit / Unit", "Total Profit", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {finishedGoods.map((fg) => {
                const qty        = fg.quantityOnHand;
                const price      = toNum(fg.product.price);
                const cost       = recipeUnitCost(fg);
                const profitUnit = cost !== null ? price - cost : null;
                const totalProfit = profitUnit !== null ? profitUnit * qty : null;
                const stockCls   =
                  qty === 0 ? "text-error font-medium" :
                  qty <= 5  ? "text-warning font-medium" :
                              "text-text";
                return (
                  <tr key={fg.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                    <td className="px-4 py-3 font-body text-sm font-medium text-text">
                      {fg.product.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-muted">{fg.product.sku}</td>
                    <td className={`px-4 py-3 font-body text-sm ${stockCls}`}>
                      {qty === 0 ? "Out of stock" : qty <= 5 ? `${qty} — Low` : qty}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {cost !== null ? `$${cost.toFixed(4)}` : <span className="text-text-faint italic text-[11px]">No recipe</span>}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text">
                      ${price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-medium">
                      {profitUnit !== null ? (
                        <span className={profitUnit >= 0 ? "text-success" : "text-error"}>
                          {profitUnit >= 0 ? "+" : ""}${profitUnit.toFixed(2)}
                        </span>
                      ) : <span className="text-text-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 font-display text-base font-light">
                      {totalProfit !== null ? (
                        <span className={totalProfit >= 0 ? "text-accent" : "text-error"}>
                          {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                        </span>
                      ) : <span className="text-text-faint">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-body text-[10px] tracking-widest uppercase border px-2 py-0.5",
                        fg.product.status === "ACTIVE"   ? "bg-success/10 text-success border-success/20" :
                        fg.product.status === "ARCHIVED" ? "bg-bg-subtle text-text-muted border-border" :
                                                           "bg-warning/10 text-warning border-warning/20"
                      )}>
                        {fg.product.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${fg.product.id}`}
                        className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {finishedGoods.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-light text-text-muted">No finished goods records.</p>
            </div>
          )}
        </div>
      )}

      {/* Raw Materials tab */}
      {activeTab === "materials" && (
        <div className="bg-surface border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Material", "Unit", "On Hand", "Reorder At", "Avg Cost", "Stock Value", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rawMaterials.map((rm) => {
                const stock     = toNum(rm.currentStock);
                const threshold = toNum(rm.reorderThreshold);
                const value     = stock * toNum(rm.averageCost);
                const isLow     = stock <= threshold;
                return (
                  <tr key={rm.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                    <td className="px-4 py-3 font-body text-sm font-medium text-text">{rm.name}</td>
                    <td className="px-4 py-3 font-body text-[11px] text-text-muted uppercase tracking-wider">
                      {rm.consumptionUnit.toLowerCase()}
                    </td>
                    <td className={`px-4 py-3 font-body text-sm ${isLow ? "text-warning font-medium" : "text-text"}`}>
                      {stock.toFixed(2)}{isLow ? " — Low" : ""}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      {threshold.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-muted">
                      ${toNum(rm.averageCost).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 font-display text-base font-light text-text">
                      ${value.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/inventory/materials/${rm.id}`}
                        className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rawMaterials.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-light text-text-muted">No raw materials on record.</p>
            </div>
          )}

          {rawMaterials.length > 0 && (
            <div className="px-4 py-3 border-t border-border-subtle text-right">
              <p className="font-body text-xs text-text-muted">
                Total materials value: <span className="text-text font-medium">${totalMaterialValue.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
