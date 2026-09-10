"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  lotId: string;
}

export function StockLotDeleteButton({ lotId }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="font-body text-[10px] tracking-widest uppercase text-error/60 hover:text-error transition-colors duration-150"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="font-body text-[10px] text-error">{error}</span>}
      <button
        disabled={deleting}
        onClick={() => {
          startDelete(async () => {
            const res = await fetch(`/api/admin/stock-in/${lotId}`, { method: "DELETE" });
            if (res.ok) {
              router.refresh();
            } else {
              const data = await res.json().catch(() => ({}));
              setError(data.error ?? "Failed to delete");
              setConfirm(false);
            }
          });
        }}
        className="font-body text-[10px] tracking-widest uppercase text-text-inverse bg-error px-2 py-0.5 disabled:opacity-50"
      >
        {deleting ? "…" : "Confirm"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150"
      >
        Cancel
      </button>
    </div>
  );
}
