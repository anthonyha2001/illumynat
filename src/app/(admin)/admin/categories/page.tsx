import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Categories — LUMYNAT Admin" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Catalog</p>
          <h1 className="font-display text-4xl font-light italic text-text">Categories</h1>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200"
        >
          + New Category
        </Link>
      </div>

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Name", "Slug", "Description", "Products", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                <td className="px-4 py-3 font-body text-sm font-medium text-text">{cat.name}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted font-mono text-[12px]">{cat.slug}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted max-w-xs truncate">
                  {cat.description ?? "—"}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted text-center">
                  {cat._count.products}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${
                    cat.isActive
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-bg-subtle text-text-muted border-border"
                  }`}>
                    {cat.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/categories/${cat.id}`}
                    className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
