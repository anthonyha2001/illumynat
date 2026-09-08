"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeroContent } from "@/lib/data/siteContent";
import { ImageUploader } from "@/components/admin/ImageUploader";

export function HeroForm({ initial }: { initial: HeroContent }) {
  const router = useRouter();
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof HeroContent>(key: K, value: HeroContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/hero", {
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

  function handleReset() {
    setForm(initial);
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Text content */}
      <div className="bg-surface border border-border-subtle p-6 space-y-5">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Text Content</p>

        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">Eyebrow Line</label>
          <input
            type="text"
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="e.g. Hand-poured in small batches"
            className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
          />
          <p className="font-body text-[10px] text-text-faint">Small uppercase label above the headline</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="e.g. Light the moment."
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
            <p className="font-body text-[10px] text-text-faint">First line (white)</p>
          </div>
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Headline Accent</label>
            <input
              type="text"
              value={form.headlineAccent}
              onChange={(e) => set("headlineAccent", e.target.value)}
              placeholder="e.g. Own the room."
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
            <p className="font-body text-[10px] text-text-faint">Second line (gold)</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-body text-xs text-text-muted">Sub-copy</label>
          <textarea
            value={form.subCopy}
            onChange={(e) => set("subCopy", e.target.value)}
            rows={3}
            placeholder="Supporting paragraph beneath the headline…"
            className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="bg-surface border border-border-subtle p-6 space-y-5">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Call to Actions</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Primary Button Label</label>
            <input
              type="text"
              value={form.primaryCtaLabel}
              onChange={(e) => set("primaryCtaLabel", e.target.value)}
              placeholder="Shop Collection"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Primary Button URL</label>
            <input
              type="text"
              value={form.primaryCtaHref}
              onChange={(e) => set("primaryCtaHref", e.target.value)}
              placeholder="/shop"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Secondary Link Label</label>
            <input
              type="text"
              value={form.secondaryCtaLabel}
              onChange={(e) => set("secondaryCtaLabel", e.target.value)}
              placeholder="Our Story"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-body text-xs text-text-muted">Secondary Link URL</label>
            <input
              type="text"
              value={form.secondaryCtaHref}
              onChange={(e) => set("secondaryCtaHref", e.target.value)}
              placeholder="/our-story"
              className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Background Image */}
      <div className="bg-surface border border-border-subtle p-6 space-y-4">
        <div>
          <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Background Image</p>
          <p className="font-body text-xs text-text-faint mt-1">
            Upload a photo to replace the default dark gradient. Recommended: 1920×1080px or larger.
          </p>
        </div>
        <ImageUploader
          urls={form.imageUrl ? [form.imageUrl] : []}
          onChange={(urls) => set("imageUrl", urls[0] ?? null)}
          maxImages={1}
        />
        {form.imageUrl && (
          <button
            type="button"
            onClick={() => set("imageUrl", null)}
            className="font-body text-[11px] text-text-muted hover:text-error transition-colors"
          >
            Remove image (revert to gradient)
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted font-medium">Preview</p>
        <div className="bg-bg-darker p-8 rounded-sm">
          <p className="font-body text-[10px] tracking-[0.25em] uppercase text-accent mb-3">{form.eyebrow || "—"}</p>
          <h2 className="font-display text-3xl font-light italic text-text-inverse leading-tight mb-3">
            {form.headline || "—"}<br />
            <span className="not-italic text-accent">{form.headlineAccent}</span>
          </h2>
          <p className="font-body text-xs text-white/50 max-w-xs mb-5 leading-relaxed">{form.subCopy}</p>
          <div className="flex items-center gap-5">
            <span className="px-4 py-2 bg-accent text-text-on-gold font-body text-[10px] tracking-widest uppercase">
              {form.primaryCtaLabel || "CTA"}
            </span>
            <span className="font-body text-[10px] tracking-widest uppercase text-white/40">
              {form.secondaryCtaLabel}
            </span>
          </div>
        </div>
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
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2.5 border border-border text-text-muted font-body text-[11px] tracking-widest uppercase hover:border-accent hover:text-accent transition-colors"
        >
          Reset
        </button>
        {saved && (
          <p className="font-body text-xs text-success">Saved — hero will update on next page load.</p>
        )}
      </div>
    </form>
  );
}
