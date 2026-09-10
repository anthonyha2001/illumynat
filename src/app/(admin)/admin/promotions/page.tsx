import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Promotions — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export default async function AdminPromotionsPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minimumOrderAmount: true,
      maxRedemptions: true,
      redemptionCount: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });

  const now = new Date();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Marketing</p>
          <h1 className="font-display text-4xl font-light italic text-text">Promotions</h1>
        </div>
        <Link
          href="/admin/promotions/new"
          className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200"
        >
          + New Code
        </Link>
      </div>

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Code", "Discount", "Min Order", "Used / Max", "Expires", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {codes.map((c) => {
              const expired  = c.expiresAt ? new Date(c.expiresAt) < now : false;
              const maxed    = c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions;
              const inactive = !c.isActive || expired || maxed;

              return (
                <tr key={c.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-text tracking-wider">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text">
                    {c.type === "PERCENTAGE"
                      ? `${toNum(c.value).toFixed(0)}% off`
                      : `$${toNum(c.value).toFixed(2)} off`}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">
                    {toNum(c.minimumOrderAmount) > 0 ? `$${toNum(c.minimumOrderAmount).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">
                    {c.redemptionCount}{c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${
                      expired    ? "bg-error/10 text-error border-error/20"     :
                      maxed      ? "bg-bg-subtle text-text-muted border-border" :
                      !c.isActive? "bg-bg-subtle text-text-muted border-border" :
                                   "bg-success/10 text-success border-success/20"
                    }`}>
                      {expired ? "Expired" : maxed ? "Maxed" : c.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/promotions/${c.id}`}
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
        {codes.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No promo codes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
