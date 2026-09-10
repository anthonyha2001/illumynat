import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/data/orders";

export const metadata = { title: "Order Detail — LUMYNAT" };

const STATUS_STEPS = ["PENDING", "PAID", "PROCESSING", "FULFILLED", "SHIPPED"];

function OrderTimeline({ status }: { status: string }) {
  const stepLabels: Record<string, string> = {
    PENDING:    "Order Placed",
    PAID:       "Payment Confirmed",
    PROCESSING: "Being Prepared",
    FULFILLED:  "Ready to Ship",
    SHIPPED:    "On the Way",
  };
  const currentIdx = STATUS_STEPS.indexOf(status);

  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="w-3 h-3 rounded-full bg-error" />
        <span className="font-body text-sm text-error capitalize">{status.toLowerCase()}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-2 relative">
            <div className={`w-3 h-3 rounded-full z-10 ${done ? "bg-accent" : "bg-border"} ${current ? "ring-2 ring-accent/30" : ""}`} />
            {i < STATUS_STEPS.length - 1 && (
              <div className={`absolute top-1.5 left-1/2 w-full h-px ${i < currentIdx ? "bg-accent" : "bg-border"}`} />
            )}
            <p className={`font-body text-[10px] text-center leading-tight ${done ? "text-text-subtle" : "text-text-faint"}`}>
              {stepLabels[step]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const order = await getOrderById(id, user.id);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16 max-w-2xl">
        <Link href="/account/orders" className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-6 block">
          ← All Orders
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light italic text-text">
              {order.orderNumber}
            </h1>
            <p className="font-body text-sm text-text-muted mt-1">
              Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-surface border border-border-subtle p-6 mb-6">
          <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-5">
            Order Status
          </p>
          <OrderTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="bg-surface border border-border-subtle p-6 mb-6 space-y-5">
          <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted">
            Items ({order.items.length})
          </p>
          {order.items.map((item, i) => (
            <div key={item.id}>
              <div className="flex gap-4">
                <div className="relative w-16 h-20 bg-bg-subtle shrink-0 overflow-hidden">
                  {item.product.images[0]?.url ? (
                    <Image src={item.product.images[0].url} alt={item.product.images[0].altText ?? item.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-2xl italic text-text-faint">I</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-display text-base font-light text-text hover:text-accent transition-colors duration-200 leading-snug">
                    {item.name}
                  </Link>
                  <p className="font-body text-[11px] text-text-muted mt-1">
                    SKU: {item.sku} · Qty: {item.quantity}
                  </p>
                  <p className="font-body text-sm text-text mt-1">${item.price.toFixed(2)} each</p>
                </div>
                <span className="font-body text-sm text-text shrink-0 pt-0.5">${item.subtotal.toFixed(2)}</span>
              </div>
              {i < order.items.length - 1 && <Divider className="mt-5" />}
            </div>
          ))}
        </div>

        {/* Totals + shipping in 2 col */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {/* Totals */}
          <div className="bg-surface border border-border-subtle p-6 space-y-2 font-body text-sm">
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-4">
              Payment Summary
            </p>
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span><span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Tax</span><span>${order.taxAmount.toFixed(2)}</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-text font-medium">
              <span>Total</span>
              <span className="font-display text-lg font-light">${order.total.toFixed(2)}</span>
            </div>
            {order.payments[0] && (
              <p className="font-body text-[10px] text-text-muted pt-2">
                Via {order.payments[0].method.toLowerCase()}
              </p>
            )}
          </div>

          {/* Shipping */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-4">
              Shipping Address
            </p>
            <address className="font-body text-sm text-text not-italic leading-relaxed">
              {order.shippingFirstName} {order.shippingLastName}<br />
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 && <><br />{order.shippingAddressLine2}</>}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingZipCode}<br />
              {order.shippingCountry}
            </address>
          </div>
        </div>

        {order.customerNotes && (
          <div className="bg-surface border border-border-subtle p-6 mb-6">
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-2">
              Order Notes
            </p>
            <p className="font-body text-sm text-text-subtle leading-relaxed">{order.customerNotes}</p>
          </div>
        )}

        <Button href="/shop" variant="secondary" size="md">Continue Shopping</Button>
      </Container>
    </div>
  );
}
