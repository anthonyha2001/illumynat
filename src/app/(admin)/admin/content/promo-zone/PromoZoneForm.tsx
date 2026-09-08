"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoZoneContent, PromoTheme } from "@/lib/data/siteContent";

const THEMES: { value: PromoTheme; label: string; preview: string }[] = [
  { value: "DARK", label: "Dark",  preview: "bg-bg-darker text-text-inverse" },
  { value: "LIGHT", label: "Light", preview: "bg-surface text-text" },
  { value: "GOLD", label: "Gold",  preview: "bg-accent text-text-on-gold" },
];

export function PromoZoneForm({ initial }: { initial: PromoZoneContent }) {
  const router = useRouter();
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof PromoZoneContent>(key: K, value: PromoZoneContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/promo-zone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Active toggle */}
      <div className="flex items-center justify-between bg-surface border border-border-subtle p-5">
        <div>
          <p className="font-body text-sm font-medium text-text">Promo Zone Active</p>
          <p className="font-body text-xs text-text-muted mt-0.5">
            When enabled, the banner appears at the top of your storefront.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.isActive}
          onClick={() => set("isActive", !form.isActive)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
            form.isActive ? "bg-accent" : "bg-border"
          }`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            form.isActive ? "translate-x-5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Content */}
      <div className="bg-surface border border-border-subtle p-6 space-y-5">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Content</p>

        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">Badge Text</label>
          <input
            type="text"
            value={form.badgeText}
            onChange={(e) => set("badgeText", e.target.value)}
            placeholder="e.g. Limited Time"
            className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">Headline</label>
          <input
            type="text"
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="e.g. Something special is coming."
            className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">Subheadline <span className="text-text-faint">(optional)</span></label>
          <input
            type="text"
            value={form.subheadline}
            onChange={(e) => set("subheadline", e.target.value)}
            placeholder="Supporting line of copy"
            className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">CTA Label</label>
            <input
              type="text"
              value={form.ctaLabel}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder="Shop Now"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">CTA URL</label>
            <input
              type="text"
              value={form.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="/shop"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-surface border border-border-subtle p-6 space-y-4">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("theme", t.value)}
              className={`relative p-4 border-2 transition-colors duration-150 ${
                form.theme === t.value ? "border-accent" : "border-border-subtle hover:border-border"
              }`}
            >
              <div className={`w-full h-8 mb-2 ${t.preview} flex items-center justify-center`}>
                <span className="font-body text-[10px] tracking-widest uppercase">Preview</span>
              </div>
              <p className="font-body text-xs text-text text-center">{t.label}</p>
              {form.theme === t.value && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expiry */}
      <div className="bg-surface border border-border-subtle p-6 space-y-4">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Expiry</p>
        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">
            Auto-deactivate at <span className="text-text-faint">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={form.expiresAt ? form.expiresAt.slice(0, 16) : ""}
            onChange={(e) => set("expiresAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
          />
          {form.expiresAt && (
            <button
              type="button"
              onClick={() => set("expiresAt", null)}
              className="font-body text-[11px] text-text-muted hover:text-error transition-colors"
            >
              Clear expiry
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Live Preview</p>
        <PromoPreview data={form} />
      </div>

      {/* Actions */}
      {error && <p className="font-body text-xs text-error">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-widest uppercase disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <p className="font-body text-xs text-success">Saved successfully.</p>
        )}
      </div>
    </form>
  );
}

function PromoPreview({ data }: { data: PromoZoneContent }) {
  const themeClass =
    data.theme === "GOLD"  ? "bg-accent text-text-on-gold" :
    data.theme === "LIGHT" ? "bg-surface text-text border-b border-border-subtle" :
                             "bg-bg-darker text-text-inverse";

  if (!data.isActive) {
    return (
      <div className="border border-border-subtle p-4 text-center">
        <p className="font-body text-xs text-text-faint">Promo zone is inactive — nothing will show on the storefront.</p>
      </div>
    );
  }

  return (
    <div className={`w-full py-3 px-6 flex items-center justify-center gap-6 ${themeClass}`}>
      {data.badgeText && (
        <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 border ${
          data.theme === "DARK" ? "border-white/20 text-white/70" :
          data.theme === "GOLD" ? "border-text-on-gold/30 text-text-on-gold/80" :
          "border-border text-text-muted"
        }`}>
          {data.badgeText}
        </span>
      )}
      <div className="text-center">
        <p className="font-display text-sm font-light">{data.headline || "Your headline here"}</p>
        {data.subheadline && <p className="font-body text-[11px] opacity-70 mt-0.5">{data.subheadline}</p>}
      </div>
      {data.ctaLabel && (
        <span className={`font-body text-[10px] tracking-widest uppercase underline underline-offset-2 ${
          data.theme === "DARK" ? "text-accent" :
          data.theme === "GOLD" ? "text-text-on-gold" :
          "text-accent"
        }`}>
          {data.ctaLabel} →
        </span>
      )}
    </div>
  );
}
