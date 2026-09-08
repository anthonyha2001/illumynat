"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { cn } from "@/utils/cn";

interface Category { id: string; name: string }

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  description: string;
  story: string;
  price: string;
  taxable: boolean;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId: string;
  scentFamily: string;
  burnTime: string;
  netWeight: string;
  waxType: string;
  fragranceNotes: string;
  dimensions: string;
  imageUrls: string[];
}

interface Props {
  categories: Category[];
  scentFamilies: string[];
  initial?: Partial<ProductFormData>;
  productId?: string; // if editing
}

const EMPTY: ProductFormData = {
  name: "", slug: "", sku: "", description: "", story: "",
  price: "", taxable: true, status: "DRAFT", categoryId: "",
  scentFamily: "", burnTime: "", netWeight: "", waxType: "",
  fragranceNotes: "", dimensions: "", imageUrls: [],
};
const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-5">
      <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
        {title}
      </p>
      {children}
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 4, placeholder, hint }: {
  label: string; value: string; required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number; placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
      />
      {hint && <p className="font-body text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

export function ProductForm({ categories, scentFamilies, initial, productId }: Props) {
  const router  = useRouter();
  const isEdit  = !!productId;

  const [form, setForm]       = useState<ProductFormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      // Auto-generate slug only if slug hasn't been manually edited
      slug: f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      price:    parseFloat(form.price),
    };

    try {
      const url    = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!confirm("Archive this product? It will be hidden from the store but orders are preserved.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — main fields */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Basic Info">
            <Input label="Product Name" required value={form.name} onChange={handleNameChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Slug" required value={form.slug} onChange={set("slug")} hint="URL: /products/[slug]" />
              <Input label="SKU"  required value={form.sku}  onChange={set("sku")} />
            </div>
            <Textarea label="Description" value={form.description} onChange={set("description")} rows={4} placeholder="Short product description shown on listing and detail pages." />
            <Textarea label="Story" value={form.story} onChange={set("story")} rows={5} placeholder="Longer editorial copy shown on the product detail page." />
          </Section>

          <Section title="Fragrance Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
                  Scent Family
                </label>
                <select
                  value={form.scentFamily}
                  onChange={set("scentFamily")}
                  className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
                >
                  <option value="">— Select —</option>
                  {scentFamilies.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Input label="Wax Type" value={form.waxType} onChange={set("waxType")} placeholder="Coconut-soy blend" />
            </div>
            <Textarea label="Fragrance Notes" value={form.fragranceNotes} onChange={set("fragranceNotes")} rows={2} placeholder="Top: bergamot, lemon. Heart: jasmine. Base: sandalwood, musk." />
          </Section>

          <Section title="Physical Details">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Burn Time"  value={form.burnTime}  onChange={set("burnTime")}  placeholder="45–55 hrs" />
              <Input label="Net Weight" value={form.netWeight} onChange={set("netWeight")} placeholder="220g" />
              <Input label="Dimensions" value={form.dimensions} onChange={set("dimensions")} placeholder="8×8×10cm" />
            </div>
          </Section>

          <Section title="Images">
            <ImageUploader
              urls={form.imageUrls}
              onChange={(urls) => setForm((f) => ({ ...f, imageUrls: urls }))}
            />
          </Section>
        </div>

        {/* Right — sidebar */}
        <div className="space-y-6">
          <Section title="Status & Visibility">
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
                Status
              </label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={set("status")}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className={cn(
                      "font-body text-sm",
                      s === "ACTIVE"   ? "text-success" :
                      s === "DRAFT"    ? "text-warning"  :
                                         "text-text-muted"
                    )}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.taxable}
                onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.checked }))}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="font-body text-sm text-text-subtle">Taxable</span>
            </label>
          </Section>

          <Section title="Pricing">
            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={set("price")}
              prefix="$"
            />
          </Section>

          <Section title="Category">
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={set("categoryId")}
                required
                className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
              >
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </Section>
        </div>
      </div>

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
          <Button href="/admin/products" variant="ghost" size="lg">
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
            Archive Product
          </button>
        )}
      </div>
    </form>
  );
}
