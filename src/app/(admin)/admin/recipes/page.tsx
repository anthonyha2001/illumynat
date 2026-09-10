import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";

export const metadata = { title: "Recipes — LUMYNAT Admin" };

export default async function AdminRecipesPage() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      status: true,
      recipe: {
        select: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: { versionNumber: true, status: true, yieldQuantity: true, _count: { select: { ingredients: true } } },
          },
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Manufacturing</p>
        <h1 className="font-display text-4xl font-light italic text-text">Recipes</h1>
      </div>

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Product", "SKU", "Latest Version", "Ingredients", "Recipe Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {products.map((p) => {
              const latest   = p.recipe?.versions[0];
              const hasRecipe = !!latest;
              return (
                <tr key={p.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                  <td className="px-4 py-3 font-body text-sm font-medium text-text">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-muted">{p.sku}</td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">
                    {hasRecipe ? `v${latest.versionNumber}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted text-center">
                    {hasRecipe ? latest._count.ingredients : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {!hasRecipe ? (
                      <span className="font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 bg-bg-subtle text-text-muted border-border">
                        No Recipe
                      </span>
                    ) : (
                      <span className={cn(
                        "font-body text-[10px] tracking-widest uppercase border px-2 py-0.5",
                        latest.status === "ACTIVE"   ? "bg-success/10 text-success border-success/20" :
                        latest.status === "ARCHIVED" ? "bg-bg-subtle text-text-muted border-border" :
                                                       "bg-warning/10 text-warning border-warning/20"
                      )}>
                        {latest.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/recipes/${p.id}`}
                      className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                    >
                      {hasRecipe ? "Manage →" : "Create →"}
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
          </div>
        )}
      </div>
    </div>
  );
}
