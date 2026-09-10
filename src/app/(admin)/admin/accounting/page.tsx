import { prisma } from "@/lib/prisma";
import { cn } from "@/utils/cn";
import Link from "next/link";

export const metadata = { title: "Accounting — LUMYNAT Admin" };

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminAccountingPage({ searchParams }: Props) {
  const { period } = await searchParams;
  const activePeriod = period ?? "this_month";

  const now   = new Date();
  let dateFrom: Date;
  let dateTo:   Date = now;

  switch (activePeriod) {
    case "last_month": {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case "this_year": {
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case "last_year": {
      dateFrom = new Date(now.getFullYear() - 1, 0, 1);
      dateTo   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    }
    case "all_time": {
      dateFrom = new Date(2000, 0, 1);
      break;
    }
    default: { // this_month
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  const PERIODS = [
    { key: "this_month",  label: "This Month" },
    { key: "last_month",  label: "Last Month" },
    { key: "this_year",   label: "This Year" },
    { key: "last_year",   label: "Last Year" },
    { key: "all_time",    label: "All Time" },
  ];

  // ── Revenue (paid/fulfilled/shipped orders) ─────────────
  const revenueOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED"] },
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    select: {
      subtotal: true, discountAmount: true, taxAmount: true, total: true,
    },
  });

  const revenue        = revenueOrders.reduce((s, o) => s + toNum(o.total), 0);
  const grossRevenue   = revenueOrders.reduce((s, o) => s + toNum(o.subtotal), 0);
  const totalDiscounts = revenueOrders.reduce((s, o) => s + toNum(o.discountAmount), 0);
  const totalTax       = revenueOrders.reduce((s, o) => s + toNum(o.taxAmount), 0);
  const orderCount     = revenueOrders.length;

  // ── COGS — from completed production batches ────────────
  const batches = await prisma.productionBatch.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: dateFrom, lte: dateTo },
    },
    select: { totalMaterialCost: true, actualQuantity: true, product: { select: { name: true } } },
  });

  const cogs = batches.reduce((s, b) => s + toNum(b.totalMaterialCost), 0);

  // ── Raw material purchases (stock-in) ───────────────────
  const stockLots = await prisma.stockLot.findMany({
    where: { receivedAt: { gte: dateFrom, lte: dateTo } },
    select: { totalCost: true, rawMaterial: { select: { name: true } } },
  });
  const materialPurchases = stockLots.reduce((s, l) => s + toNum(l.totalCost), 0);

  // ── Gift card liability ─────────────────────────────────
  const giftCardSales = await prisma.giftCard.findMany({
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
    select: { initialBalance: true, currentBalance: true },
  });
  const giftCardRevenue  = giftCardSales.reduce((s, g) => s + toNum(g.initialBalance), 0);
  const giftCardRedeemed = giftCardSales.reduce((s, g) => s + (toNum(g.initialBalance) - toNum(g.currentBalance)), 0);
  const giftCardLiability = giftCardRevenue - giftCardRedeemed;

  // ── Gross profit ────────────────────────────────────────
  const grossProfit  = revenue - cogs;
  const grossMargin  = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // ── Customer stats ──────────────────────────────────────
  const [newCustomers, totalCustomers] = await Promise.all([
    prisma.profile.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
    prisma.profile.count(),
  ]);

  // ── Top products by revenue ─────────────────────────────
  const topItems = await prisma.orderItem.groupBy({
    by: ["name"],
    where: { order: { status: { in: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED"] }, createdAt: { gte: dateFrom, lte: dateTo } } },
    _sum: { subtotal: true, quantity: true },
    orderBy: { _sum: { subtotal: "desc" } },
    take: 8,
  });

  // ── Monthly revenue trend (last 6 months) ───────────────
  const months: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const mOrders = await prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED"] }, createdAt: { gte: mStart, lte: mEnd } },
      _sum: { total: true },
    });
    months.push({
      label:   mStart.toLocaleDateString("en-US", { month: "short" }),
      revenue: toNum(mOrders._sum.total),
    });
  }
  const maxMonthRevenue = Math.max(...months.map((m) => m.revenue), 1);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Finance</p>
          <h1 className="font-display text-4xl font-light italic text-text">Accounting</h1>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 flex-wrap mb-8">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/accounting?period=${p.key}`}
            className={cn(
              "px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
              activePeriod === p.key
                ? "bg-accent text-text-on-gold border-accent"
                : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Net Revenue",    value: fmt(revenue),      sub: `${orderCount} orders` },
          { label: "Gross Profit",   value: fmt(grossProfit),   sub: `${grossMargin.toFixed(1)}% margin`, positive: grossProfit >= 0 },
          { label: "New Customers",  value: String(newCustomers), sub: `${totalCustomers} total` },
          { label: "Avg Order Value",value: fmt(orderCount > 0 ? revenue / orderCount : 0), sub: "per order" },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border-subtle p-5">
            <p className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted mb-2">{card.label}</p>
            <p className={cn(
              "font-display text-3xl font-light",
              "positive" in card
                ? card.positive ? "text-success" : "text-error"
                : "text-text"
            )}>
              {card.value}
            </p>
            <p className="font-body text-[11px] text-text-muted mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — detailed breakdown + trend */}
        <div className="lg:col-span-2 space-y-6">

          {/* Revenue breakdown */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Revenue Breakdown
            </p>
            <div className="space-y-3 font-body text-sm">
              {[
                { label: "Gross Revenue (pre-discount)", value: grossRevenue, cls: "text-text" },
                { label: "Discounts Given",              value: -totalDiscounts, cls: "text-error" },
                { label: "Net Product Revenue",          value: grossRevenue - totalDiscounts, cls: "text-text font-medium" },
                { label: "Tax Collected",                value: totalTax, cls: "text-text-muted" },
                { label: "Gift Card Sales",              value: giftCardRevenue, cls: "text-text-muted" },
                { label: "Gift Card Liability",          value: -giftCardLiability, cls: "text-warning" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-border-subtle last:border-0">
                  <span className="text-text-muted">{row.label}</span>
                  <span className={row.cls}>{fmt(Math.abs(row.value))}{row.value < 0 ? " (deduction)" : ""}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-border font-medium">
                <span className="text-text">Net Revenue (incl. tax)</span>
                <span className="font-display text-xl font-light text-text">{fmt(revenue)}</span>
              </div>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Revenue — Last 6 Months
            </p>
            <div className="flex items-end gap-2 h-32">
              {months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <p className="font-body text-[10px] text-text-muted">{fmt(m.revenue).replace("$", "").replace(".00", "")}</p>
                  <div
                    className="w-full bg-accent/80 transition-all duration-500"
                    style={{ height: `${Math.max((m.revenue / maxMonthRevenue) * 96, m.revenue > 0 ? 4 : 0)}px` }}
                  />
                  <p className="font-body text-[10px] text-text-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — top products + cost summary */}
        <div className="space-y-6">

          {/* Top products */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Top Products by Revenue
            </p>
            {topItems.length === 0 ? (
              <p className="font-body text-sm text-text-muted">No sales in this period.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item) => {
                  const itemRevenue = toNum(item._sum.subtotal);
                  const pct = revenue > 0 ? (itemRevenue / revenue) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between font-body text-sm mb-1">
                        <span className="text-text truncate">{item.name}</span>
                        <span className="text-text-muted shrink-0 ml-2">{fmt(itemRevenue)}</span>
                      </div>
                      <div className="h-1 bg-bg-subtle overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="font-body text-[10px] text-text-faint mt-0.5">
                        {item._sum.quantity} units · {pct.toFixed(1)}% of revenue
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost summary */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Cost Summary
            </p>
            <div className="space-y-2 font-body text-sm">
              {[
                { label: "Production COGS", value: cogs },
                { label: "Material Purchases", value: materialPurchases },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="text-text">{fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border-subtle font-medium">
                <span className="text-text">Total Costs</span>
                <span className="text-text">{fmt(cogs + materialPurchases)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-medium">
                <span className="text-text">Gross Profit</span>
                <span className={grossProfit >= 0 ? "text-success" : "text-error"}>
                  {fmt(grossProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
