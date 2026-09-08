"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useTransition } from "react";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "FULFILLED", "SHIPPED", "CANCELLED", "REFUNDED"] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_CLS: Record<OrderStatus, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/30",
  PAID:       "bg-blue-50 text-blue-600 border-blue-200",
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
  const [status, setStatus]       = useState<string>(currentStatus);
  const [notes, setNotes]         = useState(initialNotes);
  const [loading, setLoading]     = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete]   = useTransition();

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isDirty = status !== currentStatus || notes !== initialNotes;

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-5">
      <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
        Actions
      </p>

      {/* Status */}
      <div className="space-y-2">
        <p className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-2.5 py-1 font-body text-[10px] tracking-widest uppercase border transition-colors duration-150",
                status === s
                  ? STATUS_CLS[s]
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Admin notes */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted block">
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Internal notes — not shown to customer."
          className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
        />
      </div>

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={loading || !isDirty}
        className={cn(
          "w-full py-2.5 font-body text-[11px] tracking-[0.15em] uppercase transition-all duration-200",
          saved
            ? "bg-success text-white border border-success"
            : isDirty
            ? "bg-accent text-text-on-gold border border-accent hover:opacity-90"
            : "bg-bg-subtle text-text-muted border border-border cursor-not-allowed"
        )}
      >
        {loading ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
      </button>

      {/* Delete order */}
      <div className="pt-3 border-t border-border-subtle">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 font-body text-[11px] tracking-[0.15em] uppercase border border-error/40 text-error hover:bg-error/5 transition-colors duration-150"
          >
            Delete Order
          </button>
        ) : (
          <div className="space-y-2">
            <p className="font-body text-xs text-error text-center">
              This permanently deletes the order and all its data. Cannot be undone.
            </p>
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
                className="flex-1 py-2 bg-error text-white font-body text-[11px] tracking-widest uppercase disabled:opacity-50"
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
