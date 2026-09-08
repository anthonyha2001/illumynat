"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import type { SiteSettings } from "@/lib/data/settings";

interface SettingsFormProps {
  settings: SiteSettings;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [form, setForm] = useState({
    STORE_NAME:               settings.STORE_NAME,
    STORE_EMAIL:              settings.STORE_EMAIL,
    STORE_PHONE:              settings.STORE_PHONE,
    TAX_RATE:                 String(settings.TAX_RATE * 100),       // display as %
    FREE_SHIPPING_THRESHOLD:  String(settings.FREE_SHIPPING_THRESHOLD),
    SHIPPING_FEE:             String(settings.SHIPPING_FEE),
    POINTS_PER_DOLLAR:        String(settings.POINTS_PER_DOLLAR),
    POINTS_SIGNUP_BONUS:      String(settings.POINTS_SIGNUP_BONUS),
    POINTS_REVIEW_BONUS:      String(settings.POINTS_REVIEW_BONUS),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          STORE_NAME:              form.STORE_NAME,
          STORE_EMAIL:             form.STORE_EMAIL,
          STORE_PHONE:             form.STORE_PHONE,
          TAX_RATE:                parseFloat(form.TAX_RATE) / 100,  // store as decimal
          FREE_SHIPPING_THRESHOLD: parseFloat(form.FREE_SHIPPING_THRESHOLD),
          SHIPPING_FEE:            parseFloat(form.SHIPPING_FEE),
          POINTS_PER_DOLLAR:       parseFloat(form.POINTS_PER_DOLLAR),
          POINTS_SIGNUP_BONUS:     parseInt(form.POINTS_SIGNUP_BONUS, 10),
          POINTS_REVIEW_BONUS:     parseInt(form.POINTS_REVIEW_BONUS, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-xl">

      <Section title="Store Info">
        <Input label="Store Name"  value={form.STORE_NAME}  onChange={set("STORE_NAME")}  required />
        <Input label="Store Email" value={form.STORE_EMAIL} onChange={set("STORE_EMAIL")} type="email" required />
        <Input label="Store Phone" value={form.STORE_PHONE} onChange={set("STORE_PHONE")} />
      </Section>

      <Divider />

      <Section title="Commerce">
        <Input
          label="Tax Rate (%)"
          value={form.TAX_RATE}
          onChange={set("TAX_RATE")}
          type="number" step="0.1" min="0" max="100"
          hint="Applied to every taxable order. e.g. 11 = 11%"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Free Shipping Threshold ($)"
            value={form.FREE_SHIPPING_THRESHOLD}
            onChange={set("FREE_SHIPPING_THRESHOLD")}
            type="number" step="1" min="0"
            hint="Orders at or above this amount ship free."
            required
          />
          <Input
            label="Flat Shipping Fee ($)"
            value={form.SHIPPING_FEE}
            onChange={set("SHIPPING_FEE")}
            type="number" step="0.01" min="0"
            hint="Charged when order is below free-ship threshold."
            required
          />
        </div>
      </Section>

      <Divider />

      <Section title="Loyalty Points">
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Points per $1 spent"
            value={form.POINTS_PER_DOLLAR}
            onChange={set("POINTS_PER_DOLLAR")}
            type="number" step="1" min="0"
            required
          />
          <Input
            label="Signup bonus (pts)"
            value={form.POINTS_SIGNUP_BONUS}
            onChange={set("POINTS_SIGNUP_BONUS")}
            type="number" step="1" min="0"
            required
          />
          <Input
            label="Review bonus (pts)"
            value={form.POINTS_REVIEW_BONUS}
            onChange={set("POINTS_REVIEW_BONUS")}
            type="number" step="1" min="0"
            required
          />
        </div>
        <p className="font-body text-[11px] text-text-faint leading-relaxed">
          Tiers: Bronze 0–499 pts · Silver 500–1 999 pts · Gold 2 000+ pts (lifetime)
        </p>
      </Section>

      {saved && (
        <p className="font-body text-sm text-success bg-success/5 border border-success/20 px-4 py-3">
          Settings saved successfully.
        </p>
      )}
      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="md" loading={saving}>
        Save Settings
      </Button>
    </form>
  );
}
