import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Dashboard — ILLUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({
  label, value, sub, href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="bg-surface border border-border-subtle p-6 hover:border-accent transition-colors duration-200">
      <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted mb-3">{label}</p>
      <p className="font-display text-4xl font-light text-text">{value}</p>
      {sub && <p className="font-body text-xs text-text-muted mt-2">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Status badge ───────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  PENDING:    "bg-warning/10 text-warning",
  PAID:       "bg-success/10 text-success",
  PROCESSING: "bg-accent/10 text-accent",
  FULFILLED:  "bg-success/10 text-success",
  SHIPPED:    "bg-success/10 text-success",
  CANCELLED:  "bg-error/10 text-error",
};

export default async function AdminDashboard() {
  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalOrders,
    pendingOrders,
    activeProducts,
    totalCustomers,
    revenueMonth,
    revenueToday,
    recentOrders,
    lowStock,
    pendingReviews,
    unshippedOrders,
    lowMaterials,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.profile.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID","PROCESSING","FULFILLED","SHIPPED"] }, createdAt: { gte: monthStart } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID","PROCESSING","FULFILLED","SHIPPED"] }, createdAt: { gte: todayStart } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, orderNumber: true, status: true, total: true, createdAt: true,
        shippingFirstName: true, shippingLastName: true,
      },
    }),
    prisma.finishedGoods.findMany({
      where: { quantityOnHand: { lte: 5 } },
      select: {
        quantityOnHand: true,
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { quantityOnHand: "asc" },
      take: 5,
    }),
    prisma.productReview.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    prisma.rawMaterial.findMany({
      where: { isActive: true },
      select: { currentStock: true, reorderThreshold: true },
    }),
  ]);

  const monthRevenue    = toNum(revenueMonth._sum.total);
  const todayRevenue    = toNum(revenueToday._sum.total);
  const lowMaterialCount = lowMaterials.filter(
    (m) => toNum(m.currentStock) <= toNum(m.reorderThreshold)
  ).length;

  const alerts: { label: string; href: string; count: number; color: string }[] = [
    ...(pendingReviews  > 0 ? [{ label: "reviews awaiting moderation", href: "/admin/reviews",    count: pendingReviews,   color: "text-warning" }] : []),
    ...(unshippedOrders > 0 ? [{ label: "orders need attention",        href: "/admin/orders?status=PAID", count: unshippedOrders, color: "text-accent"  }] : []),
    ...(lowMaterialCount > 0 ? [{ label: "materials below reorder threshold", href: "/admin/inventory?tab=materials", count: lowMaterialCount, color: "text-error" }] : []),
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-2">Admin Portal</p>
        <h1 className="font-display text-4xl font-light italic text-text">Dashboard</h1>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {alerts.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center justify-between bg-surface border border-border-subtle px-5 py-3 hover:border-accent transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3">
                <span className={`font-display text-xl font-light ${a.color}`}>{a.count}</span>
                <span className="font-body text-sm text-text-muted group-hover:text-text transition-colors duration-150">
                  {a.label}
                </span>
              </div>
              <span className="font-body text-[11px] tracking-[0.1em] uppercase text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                View →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Revenue This Month"
          value={`$${monthRevenue.toFixed(2)}`}
          sub={`$${todayRevenue.toFixed(2)} today`}
        />
        <StatCard
          label="Total Orders"
          value={String(totalOrders)}
          sub={`${pendingOrders} need attention`}
          href="/admin/orders"
        />
        <StatCard
          label="Active Products"
          value={String(activeProducts)}
          href="/admin/products"
        />
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          href="/admin/customers"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-subtle">
              Recent Orders
            </p>
            <Link href="/admin/orders" className="font-body text-[11px] tracking-widest uppercase text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="bg-surface border border-border-subtle divide-y divide-border-subtle">
            {recentOrders.length === 0 ? (
              <p className="font-body text-sm text-text-muted p-6">No orders yet.</p>
            ) : recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-bg-subtle transition-colors duration-150 group"
              >
                <div>
                  <p className="font-body text-sm text-text group-hover:text-accent transition-colors duration-150">
                    {order.orderNumber}
                  </p>
                  <p className="font-body text-[11px] text-text-muted mt-0.5">
                    {order.shippingFirstName} {order.shippingLastName} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 ${STATUS_CLS[order.status] ?? "bg-bg-subtle text-text-muted"}`}>
                    {order.status}
                  </span>
                  <span className="font-display text-base font-light text-text">
                    ${toNum(order.total).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-subtle">
              Low Stock
            </p>
            <Link href="/admin/inventory" className="font-body text-[11px] tracking-widest uppercase text-accent hover:underline">
              Inventory
            </Link>
          </div>
          <div className="bg-surface border border-border-subtle divide-y divide-border-subtle">
            {lowStock.length === 0 ? (
              <p className="font-body text-sm text-text-muted p-6">All stock levels healthy.</p>
            ) : lowStock.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-body text-sm text-text">{item.product.name}</p>
                  <p className="font-body text-[11px] text-text-muted">{item.product.sku}</p>
                </div>
                <span className={`font-display text-xl font-light ${item.quantityOnHand === 0 ? "text-error" : "text-warning"}`}>
                  {item.quantityOnHand}
                </span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-6 space-y-2">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-subtle mb-3">
              Quick Actions
            </p>
            {[
              { label: "Add Product",    href: "/admin/products/new" },
              { label: "Manage Orders",  href: "/admin/orders" },
              { label: "Review Queue",   href: "/admin/reviews" },
              { label: "Promo Codes",    href: "/admin/promotions" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="block font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle hover:text-accent transition-colors duration-150 py-2 border-b border-border-subtle last:border-0"
              >
                {a.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
