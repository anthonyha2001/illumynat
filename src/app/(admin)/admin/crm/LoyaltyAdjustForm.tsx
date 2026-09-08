"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoyaltyAdjustForm({ profileId, customerName }: { profileId: string; customerName: string }) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [points, setPoints] = useState("");
  const [desc, setDesc]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts === 0) { setError("Enter a non-zero number."); return; }
    if (!desc.trim()) { setError("Description is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm/adjust-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, points: pts, description: desc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOpen(false);
      setPoints("");
      setDesc("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body text-[10px] tracking-[0.1em] uppercase text-accent hover:text-accent-dark transition-colors duration-150"
      >
        Adjust
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 min-w-[200px]">
      <p className="font-body text-[10px] text-text-muted">Adjust points for {customerName}</p>
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="e.g. +100 or -50"
        className="w-full bg-bg border border-border px-2 py-1 font-body text-sm text-text focus:border-accent focus:outline-none"
        autoFocus
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Reason (required)"
        className="w-full bg-bg border border-border px-2 py-1 font-body text-sm text-text focus:border-accent focus:outline-none"
      />
      {error && <p className="font-body text-[10px] text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-2 py-1 bg-accent text-text-on-gold font-body text-[10px] tracking-widest uppercase disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="font-body text-[10px] text-text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
