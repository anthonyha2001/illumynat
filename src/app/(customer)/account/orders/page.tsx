import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getOrdersByProfile } from "@/lib/data/orders";

export const metadata = { title: "My Orders — LUMYNAT" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "text-warning" },
  PAID:       { label: "Paid",       cls: "text-success" },
  PROCESSING: { label: "Processing", cls: "text-accent" },
  FULFILLED:  { label: "Fulfilled",  cls: "text-success" },
  SHIPPED:    { label: "Shipped",    cls: "text-success" },
  CANCELLED:  { label: "Cancelled",  cls: "text-error" },
  REFUNDED:   { label: "Refunded",   cls: "text-text-muted" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orders = await getOrdersByProfile(user.id);

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16 max-w-3xl">
        <div className="mb-10">
          <Link href="/account" className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block">
            ← Account
          </Link>
          <h1 className="font-display text-4xl font-light italic text-text">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <p className="font-display text-2xl font-light text-text">No orders yet</p>
            <p className="font-body text-sm text-text-muted">Your order history will appear here.</p>
            <Button href="/shop" variant="primary" size="md">Shop Collection</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const thumb  = order.items[0]?.product?.images[0]?.url;
              const status = STATUS_LABEL[order.status] ?? { label: order.status, cls: "text-text-muted" };
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center gap-4 bg-surface border border-border-subtle p-5 hover:border-accent transition-colors duration-200 group"
                >
                  <div className="relative w-14 h-16 bg-bg-subtle shrink-0 overflow-hidden">
                    {thumb ? (
                      <Image src={thumb} alt={order.items[0].name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-xl italic text-text-faint">I</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg font-light text-text group-hover:text-accent transition-colors duration-200">
                      {order.orderNumber}
                    </p>
                    <p className="font-body text-[11px] text-text-muted mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })} · {order._count.items} {order._count.items === 1 ? "item" : "items"}
                    </p>
                    <span className={`font-body text-[10px] tracking-widest uppercase mt-1 inline-block ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-xl font-light text-text">${order.total.toFixed(2)}</p>
                    <p className="font-body text-[10px] text-text-muted mt-0.5 group-hover:text-accent transition-colors duration-200">
                      View →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
