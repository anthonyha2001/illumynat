"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const UNITS = ["GRAM", "KILOGRAM", "MILLILITER", "LITER", "OUNCE", "PIECE", "METER", "CENTIMETER"] as const;

interface FormData {
  name: string;
  description: string;
  consumptionUnit: string;
  purchaseUnit: string;
  conversionFactor: string;
  reorderThreshold: string;
  isActive: boolean;
}

interface Props {
  initial?: Partial<FormData>;
  materialId?: string;
}

const EMPTY: FormData = {
  name: "", description: "",
  consumptionUnit: "GRAM", purchaseUnit: "KILOGRAM",
  conversionFactor: "1000", reorderThreshold: "0",
  isActive: true,
};

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>
        ))}
      </select>
    </div>
  );
}

export function MaterialForm({ initial, materialId }: Props) {
  const router  = useRouter();
  const isEdit  = !!materialId;

  const [form, setForm]       = useState<FormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url    = isEdit ? `/api/admin/materials/${materialId}` : "/api/admin/materials";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          conversionFactor: parseFloat(form.conversionFactor) || 1,
          reorderThreshold: parseFloat(form.reorderThreshold) || 0,
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/inventory?tab=materials");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!materialId) return;
    if (!confirm("Deactivate this material? It will be hidden but not deleted.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/materials/${materialId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/admin/inventory?tab=materials");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="bg-surface border border-border-subtle p-6 space-y-5">
        <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
          Material Details
        </p>

        <Input label="Name" required value={form.name} onChange={set("name")} placeholder="Coconut Wax" />

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={2}
            placeholder="Optional notes about this material."
            className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Consumption Unit"
            value={form.consumptionUnit}
            onChange={(v) => setForm((f) => ({ ...f, consumptionUnit: v }))}
            options={UNITS}
          />
          <SelectField
            label="Purchase Unit"
            value={form.purchaseUnit}
            onChange={(v) => setForm((f) => ({ ...f, purchaseUnit: v }))}
            options={UNITS}
          />
        </div>

        <Input
          label="Conversion Factor"
          type="number"
          step="0.000001"
          min="0"
          required
          value={form.conversionFactor}
          onChange={set("conversionFactor")}
          hint={`How many ${form.consumptionUnit.toLowerCase()}s in 1 ${form.purchaseUnit.toLowerCase()}`}
        />

        <Input
          label="Reorder Threshold"
          type="number"
          step="0.01"
          min="0"
          value={form.reorderThreshold}
          onChange={set("reorderThreshold")}
          hint={`Alert when stock falls to or below this level (${form.consumptionUnit.toLowerCase()}s)`}
        />

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
        <div className="bg-surface border border-border-subtle p-6 space-y-3">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Stock Adjustment
          </p>
          <p className="font-body text-sm text-text-muted">
            To adjust stock levels, record a stock-in entry from the{" "}
            <a href="/admin/production" className="text-accent hover:underline">Production</a> page.
            Stock is updated automatically when production batches complete.
          </p>
        </div>
      )}

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {isEdit ? "Save Changes" : "Create Material"}
          </Button>
          <Button href="/admin/inventory?tab=materials" variant="ghost" size="lg">
            Cancel
          </Button>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="font-body text-[11px] tracking-[0.12em] uppercase text-error/60 hover:text-error transition-colors duration-200"
          >
            Deactivate
          </button>
        )}
      </div>
    </form>
  );
}
