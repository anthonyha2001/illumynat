"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface FormData {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  minimumOrderAmount: string;
  maxRedemptions: string;
  expiresAt: string;
  isActive: boolean;
}

interface Props {
  initial?: Partial<FormData>;
  promoId?: string;
  redemptionCount?: number;
}

const EMPTY: FormData = {
  code: "", type: "PERCENTAGE", value: "",
  minimumOrderAmount: "0", maxRedemptions: "",
  expiresAt: "", isActive: true,
};

export function PromoForm({ initial, promoId, redemptionCount = 0 }: Props) {
  const router  = useRouter();
  const isEdit  = !!promoId;

  const [form, setForm]       = useState<FormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, code }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url    = isEdit ? `/api/admin/promotions/${promoId}` : "/api/admin/promotions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:               form.code.toUpperCase().trim(),
          type:               form.type,
          value:              parseFloat(form.value) || 0,
          minimumOrderAmount: parseFloat(form.minimumOrderAmount) || 0,
          maxRedemptions:     form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
          expiresAt:          form.expiresAt || null,
          isActive:           form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/promotions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!promoId) return;
    if (!confirm("Delete this promo code permanently?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/promotions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 max-w-3xl">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-surface border border-border-subtle p-6 space-y-5">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Code Details
          </p>

          {/* Code field with generator */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
              Promo Code *
            </label>
            <div className="flex gap-2">
              <input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className="flex-1 bg-bg border border-border px-3 py-3 font-mono text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 uppercase tracking-widest"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-3 bg-bg-subtle border border-border font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent hover:border-accent transition-colors duration-150 shrink-0"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Discount type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
              Discount Type
            </label>
            <div className="flex gap-3">
              {(["PERCENTAGE", "FIXED_AMOUNT"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={set("type")}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="font-body text-sm text-text-subtle">
                    {t === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount ($)"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label={form.type === "PERCENTAGE" ? "Discount (%)" : "Discount Amount ($)"}
            type="number"
            step={form.type === "PERCENTAGE" ? "1" : "0.01"}
            min="0"
            max={form.type === "PERCENTAGE" ? "100" : undefined}
            required
            value={form.value}
            onChange={set("value")}
            prefix={form.type === "FIXED_AMOUNT" ? "$" : undefined}
          />

          <Input
            label="Minimum Order Amount"
            type="number"
            step="0.01"
            min="0"
            value={form.minimumOrderAmount}
            onChange={set("minimumOrderAmount")}
            prefix="$"
            hint="Set to 0 for no minimum"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              {isEdit ? "Save Changes" : "Create Code"}
            </Button>
            <Button href="/admin/promotions" variant="ghost" size="lg">Cancel</Button>
          </div>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="font-body text-[11px] tracking-[0.12em] uppercase text-error/60 hover:text-error transition-colors duration-200"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <div className="bg-surface border border-border-subtle p-6 space-y-5">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Limits & Expiry
          </p>

          <Input
            label="Max Redemptions"
            type="number"
            min="1"
            value={form.maxRedemptions}
            onChange={set("maxRedemptions")}
            hint="Leave blank for unlimited"
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={set("expiresAt")}
              className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
            />
            <p className="font-body text-[11px] text-text-muted">Leave blank for no expiry</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <span className="font-body text-sm text-text-subtle">Active</span>
          </label>
        </div>

        {isEdit && (
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-3">
              Usage
            </p>
            <p className="font-display text-3xl font-light text-text">{redemptionCount}</p>
            <p className="font-body text-[11px] text-text-muted mt-1">
              redemption{redemptionCount !== 1 ? "s" : ""} so far
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
