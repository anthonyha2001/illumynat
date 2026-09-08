"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Product { id: string; name: string; sku: string }

interface GiftSetItem { productId: string; quantity: number }

interface FormData {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  price: string;
  imageUrl: string;
  tag: string;
  sortOrder: string;
  isActive: boolean;
  items: GiftSetItem[];
}

interface Props {
  products: Product[];
  initial?: Partial<Omit<FormData, "items">> & { items?: GiftSetItem[] };
  giftSetId?: string;
}

const EMPTY: FormData = {
  name: "", slug: "", subtitle: "", description: "",
  price: "", imageUrl: "", tag: "", sortOrder: "0",
  isActive: true, items: [],
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function GiftSetForm({ products, initial, giftSetId }: Props) {
  const router = useRouter();
  const isEdit = !!giftSetId;

  const [form, setForm]       = useState<FormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
    }));
  }

  function addItem() {
    const unused = products.find((p) => !form.items.some((i) => i.productId === p.id));
    if (!unused) return;
    setForm((f) => ({ ...f, items: [...f.items, { productId: unused.id, quantity: 1 }] }));
  }

  function updateItem(index: number, field: "productId" | "quantity", value: string) {
    setForm((f) => {
      const items = [...f.items];
      if (field === "quantity") items[index] = { ...items[index], quantity: parseInt(value) || 1 };
      else items[index] = { ...items[index], productId: value };
      return { ...f, items };
    });
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url    = isEdit ? `/api/admin/gift-sets/${giftSetId}` : "/api/admin/gift-sets";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:      parseFloat(form.price) || 0,
          sortOrder:  parseInt(form.sortOrder) || 0,
          subtitle:   form.subtitle   || null,
          description:form.description|| null,
          imageUrl:   form.imageUrl   || null,
          tag:        form.tag        || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/gift-sets");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!giftSetId) return;
    if (!confirm("Delete this gift set?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-sets/${giftSetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/gift-sets");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 max-w-4xl">
      <div className="lg:col-span-2 space-y-5">
        {/* Basic info */}
        <div className="bg-surface border border-border-subtle p-6 space-y-5">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Gift Set Details
          </p>
          <Input label="Name" required value={form.name} onChange={handleNameChange} />
          <Input label="Slug" required value={form.slug} onChange={set("slug")} hint="URL: /gifting#[slug]" />
          <Input label="Subtitle" value={form.subtitle} onChange={set("subtitle")} placeholder="The perfect introduction" />
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Shown on the gifting page below the set name."
              className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
            />
          </div>
          <Input label="Hero Image URL" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" />
        </div>

        {/* Products in set */}
        <div className="bg-surface border border-border-subtle p-6 space-y-4">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Products in Set
          </p>
          {form.items.length === 0 && (
            <p className="font-body text-sm text-text-muted">No products added yet.</p>
          )}
          {form.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <select
                value={item.productId}
                onChange={(e) => updateItem(i, "productId", e.target.value)}
                className="flex-1 bg-bg border border-border px-3 py-2.5 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="w-full bg-bg border border-border px-3 py-2.5 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200 text-center"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="font-body text-[11px] tracking-widest uppercase text-error/60 hover:text-error transition-colors duration-150 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          {form.items.length < products.length && (
            <button
              type="button"
              onClick={addItem}
              className="font-body text-[11px] tracking-[0.12em] uppercase text-accent hover:underline"
            >
              + Add Product
            </button>
          )}
        </div>

        {error && (
          <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              {isEdit ? "Save Changes" : "Create Gift Set"}
            </Button>
            <Button href="/admin/gift-sets" variant="ghost" size="lg">Cancel</Button>
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
            Settings
          </p>
          <Input label="Price (USD)" type="number" step="0.01" min="0" required value={form.price} onChange={set("price")} prefix="$" />
          <Input label="Tag" value={form.tag} onChange={set("tag")} placeholder="Most Gifted" hint="Optional badge shown on the card" />
          <Input label="Sort Order" type="number" min="0" value={form.sortOrder} onChange={set("sortOrder")} hint="Lower = shown first" />
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <span className="font-body text-sm text-text-subtle">Active (visible on store)</span>
          </label>
        </div>
      </div>
    </form>
  );
}
