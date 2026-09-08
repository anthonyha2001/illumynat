"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/cn";

interface Props {
  batchId: string;
  status: string;
  targetQuantity: number;
}

export function BatchActions({ batchId, status, targetQuantity }: Props) {
  const router = useRouter();
  const [actualQty, setActualQty]   = useState(String(targetQuantity));
  const [failedQty, setFailedQty]   = useState("0");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function transition(action: "start" | "complete" | "cancel") {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "complete") {
        body.actualQuantity = parseInt(actualQty) || 0;
        body.failedQuantity = parseInt(failedQty) || 0;
      }
      const res = await fetch(`/api/admin/production/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "COMPLETED" || status === "CANCELLED") {
    return (
      <div className="bg-surface border border-border-subtle p-6">
        <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-2">
          Actions
        </p>
        <p className="font-body text-sm text-text-muted">
          This batch is {status.toLowerCase()} — no further actions available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-4">
      <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
        Actions
      </p>

      {status === "PENDING" && (
        <>
          <p className="font-body text-sm text-text-muted">
            Start this batch to begin production and track it as in progress.
          </p>
          <button
            onClick={() => transition("start")}
            disabled={loading}
            className="w-full py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start Batch"}
          </button>
          <button
            onClick={() => transition("cancel")}
            disabled={loading}
            className="w-full py-2 font-body text-[11px] tracking-[0.12em] uppercase text-error/60 hover:text-error transition-colors duration-200"
          >
            Cancel Batch
          </button>
        </>
      )}

      {status === "IN_PROGRESS" && (
        <>
          <p className="font-body text-[11px] text-text-muted">
            Completing the batch will deduct raw materials and add units to finished goods.
          </p>
          <Input
            label="Actual Yield (units produced)"
            type="number"
            min="0"
            value={actualQty}
            onChange={(e) => setActualQty(e.target.value)}
          />
          <Input
            label="Failed / Discarded"
            type="number"
            min="0"
            value={failedQty}
            onChange={(e) => setFailedQty(e.target.value)}
          />
          <button
            onClick={() => transition("complete")}
            disabled={loading}
            className={cn(
              "w-full py-2.5 font-body text-[11px] tracking-[0.15em] uppercase transition-all duration-200",
              "bg-success text-white hover:opacity-90 disabled:opacity-50"
            )}
          >
            {loading ? "Completing…" : "Complete Batch"}
          </button>
          <button
            onClick={() => transition("cancel")}
            disabled={loading}
            className="w-full py-2 font-body text-[11px] tracking-[0.12em] uppercase text-error/60 hover:text-error transition-colors duration-200"
          >
            Cancel Batch
          </button>
        </>
      )}

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">{error}</p>
      )}
    </div>
  );
}
