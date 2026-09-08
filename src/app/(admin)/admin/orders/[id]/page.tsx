import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Divider } from "@/components/ui/Divider";
import { OrderActions } from "./OrderActions";
import { ShipmentPanel } from "./ShipmentPanel";
import { ReturnPanel } from "./ReturnPanel";

interface Props { params: Promise<{ id: string }> }

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: `${order?.orderNumber ?? "Order"} — ILLUMYNAT Admin` };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      customerNotes: true,
      adminNotes: true,
      shippingFirstName: true,
      shippingLastName: true,
      shippingAddressLine1: true,
      shippingAddressLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingZipCode: true,
      shippingCountry: true,
      guestEmail: true,
      guestPhone: true,
      profile: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      items: {
        select: {
          id: true, name: true, sku: true, price: true, quantity: true, subtotal: true,
          product: {
            select: {
              id: true, slug: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
            },
          },
        },
      },
      payments: {
        select: { id: true, method: true, status: true, amount: true, confirmedAt: true, stripePaymentIntentId: true },
      },
      shipment: {
        select: {
          carrier: true, trackingNumber: true, estimatedDelivery: true, notes: true, shippedAt: true,
        },
      },
      returns: {
        select: {
          id: true, reason: true, status: true, refundAmount: true, createdAt: true, stripeRefundId: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  const customerName = order.profile
    ? `${order.profile.firstName} ${order.profile.lastName}`
    : `${order.shippingFirstName} ${order.shippingLastName}`;
  const customerEmail = order.profile?.email ?? order.guestEmail ?? "—";
  const customerPhone = order.profile?.phone ?? order.guestPhone ?? "—";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/admin/orders"
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
          >
            ← Orders
          </Link>
          <h1 className="font-display text-4xl font-light italic text-text">{order.orderNumber}</h1>
          <p className="font-body text-sm text-text-muted mt-1">
            Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        <a
          href={`/admin/orders/${order.id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 border border-border text-text-muted font-body text-[11px] tracking-[0.12em] uppercase hover:border-accent hover:text-accent transition-colors duration-200"
        >
          Print Slip
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — order detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Items ({order.items.length})
            </p>
            <div className="space-y-5">
              {order.items.map((item, i) => (
                <div key={item.id}>
                  <div className="flex gap-4">
                    <div className="relative w-14 h-18 bg-bg-subtle shrink-0 overflow-hidden" style={{ height: 72 }}>
                      {item.product.images[0]?.url ? (
                        <Image src={item.product.images[0].url} alt={item.name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-xl italic text-text-faint">I</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/admin/products/${item.product.id}`} className="font-body text-sm text-text hover:text-accent transition-colors duration-150">
                        {item.name}
                      </Link>
                      <p className="font-body text-[11px] text-text-muted mt-0.5">SKU: {item.sku}</p>
                      <p className="font-body text-[11px] text-text-muted">
                        ${toNum(item.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-body text-sm text-text shrink-0">
                      ${toNum(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                  {i < order.items.length - 1 && <Divider className="mt-5" />}
                </div>
              ))}
            </div>

            <Divider className="my-5" />

            <div className="space-y-2 font-body text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span><span>${toNum(order.subtotal).toFixed(2)}</span>
              </div>
              {toNum(order.discountAmount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span><span>-${toNum(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Tax</span><span>${toNum(order.taxAmount).toFixed(2)}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between text-text font-medium">
                <span>Total</span>
                <span className="font-display text-xl font-light">${toNum(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Payment
            </p>
            {order.payments.length === 0 ? (
              <p className="font-body text-sm text-text-muted">No payment recorded.</p>
            ) : order.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm text-text capitalize">{p.method.toLowerCase()}</p>
                  {p.stripePaymentIntentId && (
                    <p className="font-body text-[10px] text-text-muted font-mono">{p.stripePaymentIntentId}</p>
                  )}
                  {p.confirmedAt && (
                    <p className="font-body text-[11px] text-text-muted">
                      Confirmed {new Date(p.confirmedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-light text-text">${toNum(p.amount).toFixed(2)}</p>
                  <span className={`font-body text-[10px] tracking-widest uppercase ${
                    p.status === "COMPLETED" ? "text-success" :
                    p.status === "FAILED"    ? "text-error" : "text-warning"
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-surface border border-border-subtle p-6 space-y-4">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">Notes</p>
              {order.customerNotes && (
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-text-muted mb-1">Customer</p>
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{order.customerNotes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-text-muted mb-1">Admin</p>
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{order.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — actions + meta */}
        <div className="space-y-6">
          {/* Actions */}
          <OrderActions orderId={order.id} currentStatus={order.status} adminNotes={order.adminNotes ?? ""} />

          {/* Customer */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Customer
            </p>
            <p className="font-body text-sm text-text">{customerName}</p>
            <p className="font-body text-[11px] text-text-muted mt-1">{customerEmail}</p>
            <p className="font-body text-[11px] text-text-muted">{customerPhone}</p>
            {order.profile && (
              <Link
                href={`/admin/customers/${order.profile.id}`}
                className="inline-block mt-3 font-body text-[11px] tracking-widest uppercase text-accent hover:underline"
              >
                View Profile →
              </Link>
            )}
          </div>

          {/* Shipping address */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Ship To
            </p>
            <address className="font-body text-sm text-text not-italic leading-relaxed">
              {order.shippingFirstName} {order.shippingLastName}<br />
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 && <><br />{order.shippingAddressLine2}</>}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingZipCode}<br />
              {order.shippingCountry}
            </address>
          </div>

          {/* Shipment tracking */}
          <ShipmentPanel orderId={order.id} shipment={order.shipment} />

          {/* Returns & Refunds */}
          <ReturnPanel
            orderId={order.id}
            items={order.items.map((i) => ({
              id: i.id, name: i.name, quantity: i.quantity,
              price: toNum(i.price), subtotal: toNum(i.subtotal),
            }))}
            existingReturns={order.returns.map((r) => ({
              ...r, refundAmount: toNum(r.refundAmount),
            }))}
            hasCompletedPayment={order.payments.some((p) => p.status === "COMPLETED")}
          />
        </div>
      </div>
    </div>
  );
}
