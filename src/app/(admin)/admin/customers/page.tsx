import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Customers — ILLUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const { search } = await searchParams;

  const profiles = await prisma.profile.findMany({
    where: {
      role: "CUSTOMER",
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName:  { contains: search, mode: "insensitive" } },
          { email:     { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: { total: true },
      },
    },
  });

  const customers = profiles.map((p) => ({
    ...p,
    totalSpent: p.orders.reduce((sum, o) => sum + toNum(o.total), 0),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">CRM</p>
          <h1 className="font-display text-4xl font-light italic text-text">Customers</h1>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="mb-6">
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search name or email…"
          className="w-full max-w-sm bg-surface border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </form>

      <div className="bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Customer", "Email", "Joined", "Orders", "Total Spent", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                <td className="px-4 py-3">
                  <p className="font-body text-sm font-medium text-text">{c.firstName} {c.lastName}</p>
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">{c.email}</td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted text-center">
                  {c._count.orders}
                </td>
                <td className="px-4 py-3 font-display text-base font-light text-text">
                  ${c.totalSpent.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No customers found.</p>
          </div>
        )}
      </div>

      <p className="font-body text-xs text-text-muted mt-4 text-right">
        {customers.length} customer{customers.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
