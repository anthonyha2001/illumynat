"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "FULFILLED" | "SHIPPED" | "CANCELLED" | "REFUNDED";

// The normal forward steps
const STEPS: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "FULFILLED", "SHIPPED"];

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING:    "Pending",
  PAID:       "Paid",
  PROCESSING: "Processing",
  FULFILLED:  "Fulfilled",
  SHIPPED:    "Shipped",
  CANCELLED:  "Cancelled",
  REFUNDED:   "Refunded",
};

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PENDING:    { label: "Confirm Payment",  next: "PAID" },
  PAID:       { label: "Start Processing", next: "PROCESSING" },
  PROCESSING: { label: "Mark as Fulfilled", next: "FULFILLED" },
  FULFILLED:  { label: "Mark as Shipped",  next: "SHIPPED" },
};

const STATUS_CLS: Record<OrderStatus, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/30",
  PAID:       "bg-info/10 text-info border-info/30",
  PROCESSING: "bg-accent/10 text-accent border-accent/30",
  FULFILLED:  "bg-success/10 text-success border-success/30",
  SHIPPED:    "bg-success/10 text-success border-success/30",
  CANCELLED:  "bg-error/10 text-error border-error/30",
  REFUNDED:   "bg-bg-subtle text-text-muted border-border",
};

interface Props {
  orderId: string;
  currentStatus: string;
  adminNotes: string;
}

export function OrderActions({ orderId, currentStatus, adminNotes: initialNotes }: Props) {
  const router = useRouter();
  const status = currentStatus as OrderStatus;
  const [notes, setNotes]             = useState(initialNotes);
  const [notesDirty, setNotesDirty]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [deleting, startDelete]       = useTransition();

  const nextAction = NEXT_ACTION[status];
  const isFinal    = ["SHIPPED", "CANCELLED", "REFUNDED"].includes(status);
  const canCancel  = !["SHIPPED", "CANCELLED", "REFUNDED"].includes(status);
  const canRefund  = status === "SHIPPED";

  const stepIndex  = STEPS.indexOf(status);

  async function advance() {
    if (!nextAction) return;
    await patch({ status: nextAction.next });
  }

  async function cancel() {
    await patch({ status: "CANCELLED" });
    setConfirmCancel(false);
  }

  async function refund() {
    await patch({ status: "REFUNDED" });
  }

  async function saveNotes() {
    await patch({ adminNotes: notes });
    setNotesDirty(false);
  }

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-6">
      {/* Current status */}
      <div className="flex items-center justify-between">
        <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
          Order Status
        </p>
        <span className={cn(
          "font-body text-[10px] tracking-widest uppercase border px-3 py-1",
          STATUS_CLS[status]
        )}>
          {STEP_LABELS[status]}
        </span>
      </div>

      {/* Progress bar — only for forward statuses */}
      {stepIndex >= 0 && (
        <div className="space-y-2">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                  i < stepIndex  ? "bg-accent border-accent" :
                  i === stepIndex ? "bg-surface border-accent" :
                                   "bg-surface border-border"
                )}>
                  {i < stepIndex && (
                    <svg className="w-2.5 h-2.5 text-text-on-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {i === stepIndex && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 transition-all duration-300",
                    i < stepIndex ? "bg-accent" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s) => (
              <p key={s} className={cn(
                "font-body text-[9px] tracking-[0.08em] uppercase",
                s === status ? "text-accent font-medium" : "text-text-faint"
              )}>
                {STEP_LABELS[s]}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Next action button */}
      {nextAction && !isFinal && (
        <button
          onClick={advance}
          disabled={loading}
          className="w-full py-3 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Updating…" : `→ ${nextAction.label}`}
        </button>
      )}

      {isFinal && !canRefund && (
        <div className="py-3 text-center">
          <p className="font-body text-sm text-text-muted">
            This order is <span className="text-text">{STEP_LABELS[status].toLowerCase()}</span> — no further actions.
          </p>
        </div>
      )}

      {/* Refund (after shipped) */}
      {canRefund && (
        <button
          onClick={refund}
          disabled={loading}
          className="w-full py-2.5 border border-error/40 text-error font-body text-[11px] tracking-[0.15em] uppercase hover:bg-error/5 transition-colors disabled:opacity-50"
        >
          {loading ? "Updating…" : "Mark as Refunded"}
        </button>
      )}

      {/* Cancel */}
      {canCancel && (
        <div>
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full py-2 font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-error transition-colors"
            >
              Cancel Order
            </button>
          ) : (
            <div className="border border-error/20 p-3 space-y-3 bg-error/5">
              <p className="font-body text-xs text-error text-center">Cancel this order?</p>
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  disabled={loading}
                  className="flex-1 py-2 bg-error text-text-inverse font-body text-[11px] tracking-widest uppercase disabled:opacity-50"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-accent hover:text-accent transition-colors"
                >
                  Keep Order
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">{error}</p>
      )}
      {saved && (
        <p className="font-body text-xs text-success text-center">Updated ✓</p>
      )}

      {/* Admin notes */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted block">
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
          rows={3}
          placeholder="Internal notes — not shown to customer."
          className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
        />
        {notesDirty && (
          <button
            onClick={saveNotes}
            disabled={loading}
            className="w-full py-2 bg-text text-text-inverse font-body text-[11px] tracking-[0.12em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors disabled:opacity-50"
          >
            Save Notes
          </button>
        )}
      </div>

      {/* Delete */}
      <div className="pt-2 border-t border-border-subtle">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2 font-body text-[10px] tracking-widest uppercase text-error/50 hover:text-error transition-colors"
          >
            Delete Order
          </button>
        ) : (
          <div className="space-y-2">
            <p className="font-body text-xs text-error text-center">Permanently delete? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  startDelete(async () => {
                    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
                    if (res.ok) router.push("/admin/orders");
                    else setError("Failed to delete order.");
                  });
                }}
                disabled={deleting}
                className="flex-1 py-2 bg-error text-text-inverse font-body text-[11px] tracking-widest uppercase disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-accent hover:text-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
