import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Gift Sets — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export default async function AdminGiftSetsPage() {
  const sets = await prisma.giftSet.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subtitle: true,
      price: true,
      tag: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Gifting</p>
          <h1 className="font-display text-4xl font-light italic text-text">Gift Sets</h1>
        </div>
        <Link
          href="/admin/gift-sets/new"
          className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200"
        >
          + New Gift Set
        </Link>
      </div>

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Name", "Subtitle", "Products", "Price", "Tag", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sets.map((s) => (
              <tr key={s.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                <td className="px-4 py-3 font-body text-sm font-medium text-text">{s.name}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">{s.subtitle ?? "—"}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted text-center">{s._count.items}</td>
                <td className="px-4 py-3 font-display text-base font-light text-text">
                  ${toNum(s.price).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {s.tag ? (
                    <span className="font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 bg-accent/10 text-accent border-accent/20">
                      {s.tag}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${
                    s.isActive
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-bg-subtle text-text-muted border-border"
                  }`}>
                    {s.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/gift-sets/${s.id}`}
                    className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sets.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No gift sets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
