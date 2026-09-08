import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { GiftCardActions } from "./GiftCardActions";

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
  params: Promise<{ id: string }>;
}

export default async function AdminGiftCardDetailPage({ params }: Props) {
  const { id } = await params;

  const gc = await prisma.giftCard.findUnique({
    where: { id },
    include: {
      issuedToProfile: { select: { firstName: true, lastName: true, email: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        include: { },
      },
    },
  });

  if (!gc) notFound();

  const initial  = toNum(gc.initialBalance);
  const balance  = toNum(gc.currentBalance);
  const redeemed = initial - balance;
  const pctLeft  = initial > 0 ? (balance / initial) * 100 : 0;
  const isExpired = gc.expiresAt ? gc.expiresAt < new Date() : false;

  const TX_TYPE_LABELS: Record<string, { label: string; cls: string; sign: string }> = {
    ISSUED:   { label: "Issued",   cls: "text-success",      sign: "+" },
    REDEEMED: { label: "Redeemed", cls: "text-text-muted",   sign: "−" },
    REFUNDED: { label: "Refunded", cls: "text-accent",       sign: "+" },
    ADJUSTED: { label: "Adjusted", cls: "text-warning",      sign: "±" },
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/admin/gift-cards"
            className="font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-accent transition-colors duration-150 mb-3 inline-block"
          >
            ← Gift Cards
          </Link>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Gift Card</p>
          <h1 className="font-display text-4xl font-light text-text tracking-widest">{gc.code}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — details + transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Balance visual */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Balance
            </p>
            <div className="flex items-end gap-6 mb-4">
              <div>
                <p className="font-body text-[10px] tracking-[0.1em] uppercase text-text-faint mb-1">Current</p>
                <p className="font-display text-5xl font-light text-text">{fmt(balance)}</p>
              </div>
              <div className="pb-1">
                <p className="font-body text-[10px] tracking-[0.1em] uppercase text-text-faint mb-1">of</p>
                <p className="font-display text-2xl font-light text-text-muted">{fmt(initial)}</p>
              </div>
            </div>
            <div className="w-full h-2 bg-bg-subtle overflow-hidden mb-2">
              <div
                className="h-full bg-accent transition-all duration-700"
                style={{ width: `${pctLeft}%` }}
              />
            </div>
            <div className="flex justify-between font-body text-[11px] text-text-faint">
              <span>{fmt(redeemed)} redeemed</span>
              <span>{pctLeft.toFixed(0)}% remaining</span>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Transaction History
            </p>

            {gc.transactions.length === 0 ? (
              <p className="font-body text-sm text-text-muted">No transactions yet.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border-subtle">
                {gc.transactions.map((tx) => {
                  const meta = TX_TYPE_LABELS[tx.type] ?? { label: tx.type, cls: "text-text-muted", sign: "" };
                  const amt  = toNum(tx.amount);
                  return (
                    <div key={tx.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-body text-xs font-medium tracking-[0.08em] uppercase", meta.cls)}>
                            {meta.label}
                          </span>
                          {tx.orderId && (
                            <Link
                              href={`/admin/orders/${tx.orderId}`}
                              className="font-body text-[10px] text-accent hover:underline"
                            >
                              View order
                            </Link>
                          )}
                        </div>
                        {tx.notes && (
                          <p className="font-body text-[11px] text-text-faint">{tx.notes}</p>
                        )}
                        <p className="font-body text-[11px] text-text-faint">
                          {tx.createdAt.toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}{" "}
                          at{" "}
                          {tx.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("font-body text-sm font-medium", meta.cls)}>
                          {meta.sign}{fmt(amt)}
                        </p>
                        <p className="font-body text-[11px] text-text-faint">
                          bal. {fmt(toNum(tx.balanceAfter))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — metadata + actions */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-surface border border-border-subtle p-6 space-y-4">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
              Details
            </p>

            <div className="space-y-3 font-body text-sm">
              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-text-faint mb-0.5">Issued To</p>
                {gc.issuedToProfile ? (
                  <p className="text-text">
                    {gc.issuedToProfile.firstName} {gc.issuedToProfile.lastName}
                    <br />
                    <span className="text-text-muted text-xs">{gc.issuedToProfile.email}</span>
                  </p>
                ) : gc.issuedToEmail ? (
                  <p className="text-text">{gc.issuedToEmail}</p>
                ) : (
                  <p className="text-text-faint">Not assigned</p>
                )}
              </div>

              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-text-faint mb-0.5">Issued On</p>
                <p className="text-text">
                  {gc.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-text-faint mb-0.5">Expires</p>
                <p className={cn("text-text", isExpired && "text-error")}>
                  {gc.expiresAt
                    ? gc.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    : "Never"}
                  {isExpired && " (expired)"}
                </p>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase text-text-faint mb-0.5">Status</p>
                <span className={cn(
                  "px-2 py-0.5 font-body text-[10px] tracking-[0.08em] uppercase",
                  gc.isActive ? "bg-success/10 text-success" : "bg-border/40 text-text-muted"
                )}>
                  {gc.isActive ? "Active" : "Deactivated"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <GiftCardActions
            id={gc.id}
            isActive={gc.isActive}
            currentBalance={balance}
          />
        </div>
      </div>
    </div>
  );
}
