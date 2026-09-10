import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Divider } from "@/components/ui/Divider";

interface Props { params: Promise<{ id: string }> }

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

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const p = await prisma.profile.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
  return { title: `${p ? `${p.firstName} ${p.lastName}` : "Customer"} — LUMYNAT Admin` };
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: {
        select: {
          id: true, label: true, firstName: true, lastName: true,
          addressLine1: true, addressLine2: true, city: true,
          state: true, zipCode: true, country: true, isDefault: true,
        },
        orderBy: { isDefault: "desc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, orderNumber: true, status: true, total: true, createdAt: true,
          _count: { select: { items: true } },
        },
      },
      wishlistItems: {
        select: {
          product: {
            select: {
              id: true, name: true, slug: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((sum, o) => sum + toNum(o.total), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/customers"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Customers
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Customer since {new Date(customer.createdAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order history */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Order History ({customer.orders.length})
            </p>
            {customer.orders.length === 0 ? (
              <p className="font-body text-sm text-text-muted">No orders yet.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border-subtle">
                {customer.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-body text-sm font-medium text-text">{order.orderNumber}</p>
                      <p className="font-body text-[11px] text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{order._count.items} item{order._count.items !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${STATUS_CLS[order.status] ?? ""}`}>
                        {order.status}
                      </span>
                      <p className="font-display text-base font-light text-text">${toNum(order.total).toFixed(2)}</p>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist */}
          {customer.wishlistItems.length > 0 && (
            <div className="bg-surface border border-border-subtle p-6">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
                Wishlist ({customer.wishlistItems.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {customer.wishlistItems.map(({ product }) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="font-body text-xs text-text-muted border border-border px-2.5 py-1 hover:border-accent hover:text-accent transition-colors duration-150"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — profile + addresses */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-surface border border-border-subtle p-6 space-y-4">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
              Summary
            </p>
            <div>
              <p className="font-body text-[11px] text-text-muted">Total Spent</p>
              <p className="font-display text-2xl font-light text-text">${totalSpent.toFixed(2)}</p>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 font-body text-sm">
              <div>
                <p className="text-[11px] text-text-muted">Orders</p>
                <p className="text-text font-medium">{customer.orders.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted">Wishlist</p>
                <p className="text-text font-medium">{customer.wishlistItems.length}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-surface border border-border-subtle p-6 space-y-2">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Contact
            </p>
            <p className="font-body text-sm text-text">{customer.email}</p>
            {customer.phone && (
              <p className="font-body text-sm text-text-muted">{customer.phone}</p>
            )}
          </div>

          {/* Addresses */}
          {customer.addresses.length > 0 && (
            <div className="bg-surface border border-border-subtle p-6">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
                Addresses
              </p>
              <div className="space-y-4">
                {customer.addresses.map((addr, i) => (
                  <div key={addr.id}>
                    {i > 0 && <Divider className="mb-4" />}
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-body text-[10px] tracking-widest uppercase text-text-muted">
                        {addr.label ?? (addr.isDefault ? "Default" : `Address ${i + 1}`)}
                      </p>
                      {addr.isDefault && (
                        <span className="font-body text-[9px] tracking-widest uppercase text-accent">Default</span>
                      )}
                    </div>
                    <address className="font-body text-sm text-text not-italic leading-relaxed">
                      {addr.firstName} {addr.lastName}<br />
                      {addr.addressLine1}
                      {addr.addressLine2 && <><br />{addr.addressLine2}</>}<br />
                      {addr.city}, {addr.state} {addr.zipCode}<br />
                      {addr.country}
                    </address>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
