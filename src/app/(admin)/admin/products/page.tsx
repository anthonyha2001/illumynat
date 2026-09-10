import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Products — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

const STATUS_CLS: Record<string, string> = {
  ACTIVE:   "bg-success/10 text-success border-success/20",
  DRAFT:    "bg-warning/10 text-warning border-warning/20",
  ARCHIVED: "bg-bg-subtle text-text-muted border-border",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      price: true,
      status: true,
      scentFamily: true,
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      finishedGoods: { select: { quantityOnHand: true } },
      _count: { select: { orderItems: true } },
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Catalog</p>
          <h1 className="font-display text-4xl font-light italic text-text">Products</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="font-body text-[11px] tracking-[0.12em] uppercase bg-accent text-text-on-gold px-6 py-3 hover:bg-accent-dark transition-colors duration-200"
        >
          + New Product
        </Link>
      </div>

      {/* Summary */}
      <div className="flex gap-6 mb-6 font-body text-sm text-text-muted">
        <span>{products.filter(p => p.status === "ACTIVE").length} active</span>
        <span>{products.filter(p => p.status === "DRAFT").length} draft</span>
        <span>{products.filter(p => p.status === "ARCHIVED").length} archived</span>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Product", "SKU", "Category", "Price", "Stock", "Sales", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {products.map((p) => {
              const qty = p.finishedGoods?.quantityOnHand ?? null;
              return (
                <tr key={p.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                  {/* Product name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="w-10 h-12 object-cover bg-bg-subtle shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-bg-subtle flex items-center justify-center shrink-0">
                          <span className="font-display text-lg italic text-text-faint">I</span>
                        </div>
                      )}
                      <div>
                        <p className="font-body text-sm text-text">{p.name}</p>
                        {p.scentFamily && (
                          <p className="font-body text-[10px] text-text-muted">{p.scentFamily}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-text-muted">{p.sku}</td>
                  <td className="px-4 py-3 font-body text-sm text-text-subtle">{p.category.name}</td>
                  <td className="px-4 py-3 font-body text-sm text-text">${toNum(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-sm font-medium ${
                      qty === null ? "text-text-muted" :
                      qty === 0   ? "text-error" :
                      qty <= 5    ? "text-warning" : "text-text"
                    }`}>
                      {qty === null ? "—" : qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">{p._count.orderItems}</td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${STATUS_CLS[p.status] ?? ""}`}>
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
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
        {products.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No products yet.</p>
            <Link href="/admin/products/new" className="mt-4 inline-block font-body text-sm text-accent hover:underline">
              Create your first product →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
