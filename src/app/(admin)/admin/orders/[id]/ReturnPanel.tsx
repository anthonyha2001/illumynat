"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReturnRecord {
  id: string;
  reason: string;
  status: string;
  refundAmount: number;
  createdAt: Date;
  stripeRefundId: string | null;
}

interface ReturnPanelProps {
  orderId: string;
  items: OrderItem[];
  existingReturns: ReturnRecord[];
  hasCompletedPayment: boolean;
}

const RETURN_REASONS = [
  "Changed mind",
  "Item damaged or defective",
  "Wrong item received",
  "Item not as described",
  "Quality issue",
  "Other",
];

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return 0;
}

export function ReturnPanel({ orderId, items, existingReturns, hasCompletedPayment }: ReturnPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason]   = useState(RETURN_REASONS[0]);
  const [notes, setNotes]     = useState("");
  const [processRefund, setProcessRefund] = useState(true);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundAmount = items.reduce((sum, item) => {
    const qty = selected[item.id] ?? 0;
    return sum + qty * toNum(item.price);
  }, 0);

  function toggleItem(itemId: string, max: number) {
    setSelected((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: max };
    });
  }

  async function handleSubmit() {
    if (Object.keys(selected).length === 0) {
      setError("Select at least one item to return.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          notes: notes || undefined,
          items: Object.entries(selected).map(([orderItemId, quantity]) => ({
            orderItemId, quantity,
          })),
          refundAmount,
          processRefund: processRefund && hasCompletedPayment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create return");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-muted">
          Returns & Refunds
        </p>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="font-body text-[11px] tracking-[0.1em] uppercase text-accent hover:text-accent-dark transition-colors duration-150"
          >
            + Create Return
          </button>
        )}
      </div>

      {/* Existing returns */}
      {existingReturns.length > 0 && (
        <div className="space-y-2 mb-4">
          {existingReturns.map((ret) => (
            <div key={ret.id} className="flex items-center justify-between bg-bg-subtle px-4 py-3 text-sm">
              <div>
                <p className="font-body text-sm text-text">{ret.reason}</p>
                <p className="font-body text-[11px] text-text-muted mt-0.5">
                  {new Date(ret.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {ret.stripeRefundId && <span className="ml-2 text-success">· Stripe refund issued</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-light text-text">${toNum(ret.refundAmount).toFixed(2)}</p>
                <span className={cn(
                  "font-body text-[10px] tracking-widest uppercase",
                  ret.status === "REFUNDED" ? "text-success" : ret.status === "REJECTED" ? "text-error" : "text-warning"
                )}>{ret.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {existingReturns.length === 0 && !open && (
        <p className="font-body text-sm text-text-faint">No returns on this order.</p>
      )}

      {/* New return form */}
      {open && (
        <div className="space-y-4 border-t border-border-subtle pt-4">
          {/* Select items */}
          <div>
            <p className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted mb-2">Items to Return</p>
            <div className="space-y-2">
              {items.map((item) => {
                const checked = item.id in selected;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 border cursor-pointer transition-colors duration-150",
                      checked ? "border-accent bg-accent/5" : "border-border hover:border-text-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id, item.quantity)}
                      className="accent-[var(--color-accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-text truncate">{item.name}</p>
                      <p className="font-body text-[11px] text-text-muted">Qty: {item.quantity} · ${toNum(item.price).toFixed(2)} each</p>
                    </div>
                    {checked && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelected((p) => ({ ...p, [item.id]: Math.max(1, (p[item.id] ?? 1) - 1) })); }}
                          className="w-6 h-6 flex items-center justify-center border border-border text-text-muted hover:text-text"
                        >−</button>
                        <span className="w-6 text-center font-body text-sm">{selected[item.id]}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelected((p) => ({ ...p, [item.id]: Math.min(item.quantity, (p[item.id] ?? 1) + 1) })); }}
                          className="w-6 h-6 flex items-center justify-center border border-border text-text-muted hover:text-text"
                        >+</button>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted block mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            >
              {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted block mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-surface border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Refund amount */}
          <div className="flex items-center justify-between bg-bg-subtle px-4 py-3">
            <span className="font-body text-sm text-text-muted">Calculated Refund</span>
            <span className="font-display text-xl font-light text-text">${refundAmount.toFixed(2)}</span>
          </div>

          {/* Process Stripe refund toggle */}
          {hasCompletedPayment && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={processRefund}
                onChange={(e) => setProcessRefund(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="font-body text-sm text-text-subtle">
                Issue Stripe refund immediately (${refundAmount.toFixed(2)})
              </span>
            </label>
          )}

          {error && <p className="font-body text-sm text-error">{error}</p>}

          <div className="flex gap-3">
            <Button variant="primary" size="sm" loading={submitting} onClick={handleSubmit}>
              {processRefund && hasCompletedPayment ? "Create Return & Refund" : "Create Return"}
            </Button>
            <button
              onClick={() => { setOpen(false); setSelected({}); setError(null); }}
              className="font-body text-[11px] uppercase text-text-muted hover:text-text transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
