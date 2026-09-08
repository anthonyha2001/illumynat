import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { getOrderById } from "@/lib/data/orders";

export const metadata = { title: "Order Confirmed — ILLUMYNAT" };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:        "bg-success/10 text-success border-success/20",
    PENDING:     "bg-warning/10 text-warning border-warning/20",
    PROCESSING:  "bg-accent-pale text-accent-dark border-accent/20",
    FULFILLED:   "bg-success/10 text-success border-success/20",
    SHIPPED:     "bg-success/10 text-success border-success/20",
    CANCELLED:   "bg-error/10 text-error border-error/20",
  };
  return (
    <span className={`inline-block border font-body text-[11px] tracking-widest uppercase px-3 py-1 ${map[status] ?? "bg-bg-subtle text-text-muted border-border"}`}>
      {status}
    </span>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-20 max-w-2xl">
        {/* Success banner */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-3">
            Thank You
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light italic text-text mb-3">
            Order Confirmed
          </h1>
          <p className="font-body text-sm text-text-muted">
            We&apos;ll send a confirmation to{" "}
            <span className="text-text">{order.guestEmail ?? "your email"}</span>.
          </p>
        </div>

        {/* Order summary card */}
        <div className="bg-surface border border-border-subtle p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-body text-[11px] tracking-widest uppercase text-text-muted mb-1">Order</p>
              <p className="font-display text-xl font-light text-text">{order.orderNumber}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <Divider />

          {/* Items */}
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-16 h-20 bg-bg-subtle shrink-0 overflow-hidden">
                  {item.product.images[0]?.url ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.images[0].altText ?? item.name}
                      fill sizes="64px" className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-2xl italic text-text-faint">I</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-display text-base font-light text-text hover:text-accent transition-colors duration-200 leading-snug line-clamp-2">
                    {item.name}
                  </Link>
                  <p className="font-body text-[11px] text-text-muted mt-1">Qty: {item.quantity}</p>
                </div>
                <span className="font-body text-sm text-text shrink-0">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Divider />

          {/* Totals */}
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Tax</span>
              <span>${order.taxAmount.toFixed(2)}</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-text font-medium">
              <span>Total</span>
              <span className="font-display text-xl font-light">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <Divider />

          {/* Shipping address */}
          <div>
            <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted mb-2">
              Ships To
            </p>
            <address className="font-body text-sm text-text not-italic leading-relaxed">
              {order.shippingFirstName} {order.shippingLastName}<br />
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 && <>, {order.shippingAddressLine2}</>}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingZipCode}<br />
              {order.shippingCountry}
            </address>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Button href="/shop" variant="primary" size="lg">Continue Shopping</Button>
          <Link href="/account/orders" className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted hover:text-text transition-colors duration-200">
            View All Orders
          </Link>
        </div>
      </Container>
    </div>
  );
}
