"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaletteContent } from "@/lib/data/siteContent";
import { PALETTE_DEFAULTS } from "@/lib/data/siteContent";

const GROUPS = [
  {
    label: "Brand & Accent",
    fields: [
      { key: "gold",      label: "Accent / Gold",       hint: "Buttons, highlights, tier badges" },
      { key: "goldLight", label: "Accent Light",         hint: "Hover tints, pale overlays" },
      { key: "goldDark",  label: "Accent Dark",          hint: "Active states" },
      { key: "goldPale",  label: "Accent Pale",          hint: "Text selection background" },
    ],
  },
  {
    label: "Backgrounds",
    fields: [
      { key: "ivory",     label: "Page Background",     hint: "Main site background (--bg)" },
      { key: "cream",     label: "Subtle Background",   hint: "Section alternates (--bg-subtle)" },
      { key: "parchment", label: "Muted Background",    hint: "Cards, inputs (--bg-muted)" },
      { key: "charcoal",  label: "Dark Background",     hint: "Hero overlay (--bg-dark)" },
      { key: "espresso",  label: "Darkest Background",  hint: "Admin sidebar (--bg-darker)" },
    ],
  },
  {
    label: "Text",
    fields: [
      { key: "charcoal",  label: "Primary Text",        hint: "Body copy (--text)" },
      { key: "stone",     label: "Subtle Text",         hint: "Secondary text (--text-subtle)" },
      { key: "ash",       label: "Muted Text",          hint: "Labels, metadata (--text-muted)" },
      { key: "mist",      label: "Faint Text / Border", hint: "Placeholders, dividers" },
    ],
  },
  {
    label: "Status",
    fields: [
      { key: "success", label: "Success", hint: "Order fulfilled, positive states" },
      { key: "error",   label: "Error",   hint: "Failed, cancelled, danger" },
      { key: "warning", label: "Warning", hint: "Pending, cautionary states" },
    ],
  },
] as const;

type FieldKey = keyof PaletteContent;

export function PaletteForm({ initial }: { initial: PaletteContent }) {
  const router  = useRouter();
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  function set(key: FieldKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/palette", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(PALETTE_DEFAULTS);
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="bg-surface border border-warning/40 p-4">
        <p className="font-body text-xs text-warning">
          Changes apply site-wide instantly on the next page load. Preview changes carefully before saving.
        </p>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label} className="bg-surface border border-border-subtle p-6 space-y-4">
          <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">
            {group.label}
          </p>
          <div className="space-y-3">
            {group.fields.map((field) => {
              const key = field.key as FieldKey;
              const value = form[key] ?? "#000000";
              const defaultVal = PALETTE_DEFAULTS[key];
              const changed = value !== defaultVal;
              return (
                <div key={`${group.label}-${field.key}`} className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-10 h-10 rounded-sm cursor-pointer border border-border bg-bg p-0.5"
                      title={`Pick ${field.label}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm text-text">{field.label}</p>
                      {changed && (
                        <span className="font-body text-[9px] tracking-widest uppercase text-accent bg-accent/10 px-1.5 py-0.5">
                          Modified
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[11px] text-text-faint">{field.hint}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) set(key, v);
                      }}
                      maxLength={7}
                      className="w-24 bg-bg border border-border px-2 py-1 font-body text-xs text-text text-center focus:border-accent focus:outline-none font-mono"
                    />
                    {changed && (
                      <button
                        type="button"
                        onClick={() => set(key, defaultVal)}
                        className="font-body text-[10px] text-text-muted hover:text-error transition-colors"
                        title="Reset to default"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className="font-body text-xs text-error">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-widest uppercase disabled:opacity-50"
        >
          {saving ? "Saving…" : "Apply to Site"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2.5 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-error hover:text-error transition-colors"
        >
          Reset All to Defaults
        </button>
        {saved && (
          <p className="font-body text-xs text-success">Palette saved — reload any page to see changes.</p>
        )}
      </div>
    </form>
  );
}
