"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface Props {
  reviewId: string;
  status: string;
}

export function ReviewActions({ reviewId, status }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  async function setStatus(newStatus: "PUBLISHED" | "REJECTED" | "PENDING") {
    setLoading(newStatus);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setError("Failed to update");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {status !== "PUBLISHED" && (
        <button
          onClick={() => setStatus("PUBLISHED")}
          disabled={!!loading}
          className={cn(
            "px-3 py-1.5 font-body text-[10px] tracking-widest uppercase border transition-colors duration-150",
            "bg-success/10 text-success border-success/30 hover:bg-success hover:text-white disabled:opacity-50"
          )}
        >
          {loading === "PUBLISHED" ? "…" : "Approve"}
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          onClick={() => setStatus("REJECTED")}
          disabled={!!loading}
          className={cn(
            "px-3 py-1.5 font-body text-[10px] tracking-widest uppercase border transition-colors duration-150",
            "bg-error/10 text-error border-error/30 hover:bg-error hover:text-white disabled:opacity-50"
          )}
        >
          {loading === "REJECTED" ? "…" : "Reject"}
        </button>
      )}
      {status !== "PENDING" && (
        <button
          onClick={() => setStatus("PENDING")}
          disabled={!!loading}
          className="px-3 py-1.5 font-body text-[10px] tracking-widest uppercase border border-border text-text-muted hover:border-accent hover:text-accent transition-colors duration-150 disabled:opacity-50"
        >
          {loading === "PENDING" ? "…" : "Reset"}
        </button>
      )}
      {error && <p className="font-body text-[10px] text-error">{error}</p>}
    </div>
  );
}
