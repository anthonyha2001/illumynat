import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderFilters } from "./OrderFilters";

export const metadata = { title: "Orders — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

const STATUS_CLS: Record<string, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/20",
  PAID:       "bg-info/10 text-info border-info/20",
  PROCESSING: "bg-accent/10 text-accent border-accent/20",
  FULFILLED:  "bg-success/10 text-success border-success/20",
  SHIPPED:    "bg-success/10 text-success border-success/20",
  CANCELLED:  "bg-error/10 text-error border-error/20",
  REFUNDED:   "bg-bg-subtle text-text-muted border-border",
};

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, search } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { shippingFirstName: { contains: search, mode: "insensitive" } },
          { shippingLastName:  { contains: search, mode: "insensitive" } },
          { guestEmail:        { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      shippingFirstName: true,
      shippingLastName: true,
      guestEmail: true,
      profile: { select: { email: true } },
      _count: { select: { items: true } },
    },
  });

  // Counts per status for filter tabs
  const counts = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Fulfillment</p>
          <h1 className="font-display text-4xl font-light italic text-text">Orders</h1>
        </div>
        <a
          href={`/api/admin/orders/export${status && status !== "ALL" ? `?status=${status}` : ""}`}
          className="px-5 py-2.5 border border-border text-text-muted font-body text-[11px] tracking-[0.12em] uppercase hover:border-accent hover:text-accent transition-colors duration-200"
        >
          Export CSV
        </a>
      </div>

      <OrderFilters countMap={countMap} activeStatus={status} activeSearch={search} />

      <div className="mt-6 bg-surface border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Order", "Customer", "Date", "Items", "Total", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {orders.map((order) => {
              const email = order.profile?.email ?? order.guestEmail ?? "—";
              const customer = `${order.shippingFirstName} ${order.shippingLastName}`;
              return (
                <tr key={order.id} className="hover:bg-bg-subtle transition-colors duration-100 group">
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-text">{order.orderNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-text">{customer}</p>
                    <p className="font-body text-[11px] text-text-muted">{email}</p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-muted text-center">
                    {order._count.items}
                  </td>
                  <td className="px-4 py-3 font-display text-base font-light text-text">
                    ${toNum(order.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${STATUS_CLS[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150 opacity-0 group-hover:opacity-100"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-light text-text-muted">No orders found.</p>
          </div>
        )}
      </div>

      <p className="font-body text-xs text-text-muted mt-4 text-right">
        {orders.length} order{orders.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
