"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface Props {
  id: string;
  isActive: boolean;
  currentBalance: number;
}

export function GiftCardActions({ id, isActive, currentBalance }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual adjustment form
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjAmount, setAdjAmount]   = useState("");
  const [adjNotes, setAdjNotes]     = useState("");

  async function patch(body: Record<string, unknown>, successMsg: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSuccess(successMsg);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(adjAmount);
    if (isNaN(amount) || amount === 0) {
      setError("Enter a non-zero adjustment amount.");
      return;
    }
    await patch(
      { action: "adjust", amount, notes: adjNotes.trim() || undefined },
      `Balance adjusted by $${amount > 0 ? "+" : ""}${amount.toFixed(2)}`
    );
    setShowAdjust(false);
    setAdjAmount("");
    setAdjNotes("");
  }

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-4">
      <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
        Actions
      </p>

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="font-body text-xs text-success bg-success/5 border border-success/20 px-3 py-2">{success}</p>
      )}

      <div className="space-y-2">
        {/* Toggle active */}
        <button
          disabled={loading}
          onClick={() => patch({ action: isActive ? "deactivate" : "activate" }, isActive ? "Card deactivated" : "Card activated")}
          className={cn(
            "w-full px-4 py-2.5 font-body text-[11px] tracking-[0.12em] uppercase border transition-colors duration-200 disabled:opacity-50",
            isActive
              ? "border-error text-error hover:bg-error hover:text-text-inverse"
              : "border-success text-success hover:bg-success hover:text-text-inverse"
          )}
        >
          {isActive ? "Deactivate Card" : "Activate Card"}
        </button>

        {/* Manual adjustment */}
        <button
          disabled={loading}
          onClick={() => { setShowAdjust(!showAdjust); setError(null); setSuccess(null); }}
          className="w-full px-4 py-2.5 font-body text-[11px] tracking-[0.12em] uppercase border border-border text-text-muted hover:border-accent hover:text-accent transition-colors duration-200 disabled:opacity-50"
        >
          Adjust Balance
        </button>
      </div>

      {showAdjust && (
        <form onSubmit={handleAdjust} className="space-y-3 pt-3 border-t border-border-subtle">
          <div>
            <label className="font-body text-[10px] tracking-[0.1em] uppercase text-text-faint block mb-1">
              Amount (positive to add, negative to deduct)
            </label>
            <input
              type="number"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              placeholder="e.g. 10.00 or -5.00"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
              required
            />
            <p className="font-body text-[10px] text-text-faint mt-1">
              Current balance: ${currentBalance.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="font-body text-[10px] tracking-[0.1em] uppercase text-text-faint block mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              placeholder="Reason for adjustment"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-text text-text-inverse font-body text-[11px] tracking-[0.12em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Apply"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdjust(false); setAdjAmount(""); setAdjNotes(""); }}
              className="px-4 py-2 border border-border text-text-muted font-body text-[11px] tracking-[0.12em] uppercase hover:border-text-muted transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
