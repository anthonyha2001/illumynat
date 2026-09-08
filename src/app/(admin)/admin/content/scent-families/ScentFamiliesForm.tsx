"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initial: string[];
}

export function ScentFamiliesForm({ initial }: Props) {
  const router = useRouter();
  const [families, setFamilies] = useState<string[]>(initial);
  const [newValue, setNewValue]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  function add() {
    const val = newValue.trim();
    if (!val || families.includes(val)) return;
    setFamilies((f) => [...f, val]);
    setNewValue("");
  }

  function remove(index: number) {
    setFamilies((f) => f.filter((_, i) => i !== index));
  }

  function move(from: number, to: number) {
    const next = [...families];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFamilies(next);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/scent-families", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ families }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Current list */}
      <div className="bg-surface border border-border-subtle divide-y divide-border-subtle">
        {families.length === 0 && (
          <p className="px-4 py-6 font-body text-sm text-text-muted text-center">
            No scent families yet. Add one below.
          </p>
        )}
        {families.map((family, i) => (
          <div key={family} className="flex items-center gap-3 px-4 py-3">
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
                className="text-text-faint hover:text-accent disabled:opacity-20 transition-colors leading-none text-[10px]"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={i === families.length - 1}
                onClick={() => move(i, i + 1)}
                className="text-text-faint hover:text-accent disabled:opacity-20 transition-colors leading-none text-[10px]"
              >
                ▼
              </button>
            </div>
            <span className="flex-1 font-body text-sm text-text">{family}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="font-body text-[10px] tracking-widest uppercase text-error/60 hover:text-error transition-colors duration-150"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="e.g. Aquatic"
          className="flex-1 bg-bg border border-border px-3 py-2.5 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
        />
        <button
          type="button"
          onClick={add}
          disabled={!newValue.trim()}
          className="px-4 py-2.5 bg-bg-subtle border border-border font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:border-accent hover:text-accent disabled:opacity-40 transition-colors duration-150"
        >
          Add
        </button>
      </div>

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 font-body text-[11px] tracking-[0.15em] uppercase transition-all duration-200 bg-accent text-text-on-gold border border-accent hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
      </button>
    </div>
  );
}
