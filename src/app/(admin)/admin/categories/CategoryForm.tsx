"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface Props {
  initial?: Partial<CategoryFormData>;
  categoryId?: string;
}

const EMPTY: CategoryFormData = { name: "", slug: "", description: "", imageUrl: "", isActive: true };

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryForm({ initial, categoryId }: Props) {
  const router  = useRouter();
  const isEdit  = !!categoryId;

  const [form, setForm]       = useState<CategoryFormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: keyof CategoryFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url    = isEdit ? `/api/admin/categories/${categoryId}` : "/api/admin/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: form.imageUrl || null, description: form.description || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!categoryId) return;
    if (!confirm("Delete this category? Products in it will be uncategorized.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/categories");
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
          Category Details
        </p>

        <Input label="Name" required value={form.name} onChange={handleNameChange} />
        <Input label="Slug" required value={form.slug} onChange={set("slug")} hint="URL: /collections/[slug]" />

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={3}
            placeholder="Short description shown on the collections page."
            className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
            Hero Image
          </label>
          <ImageUploader
            maxImages={1}
            urls={form.imageUrl ? [form.imageUrl] : []}
            onChange={(urls) => setForm((f) => ({ ...f, imageUrl: urls[0] ?? "" }))}
          />
        </div>

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

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
          <Button href="/admin/categories" variant="ghost" size="lg">
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
            Delete Category
          </button>
        )}
      </div>
    </form>
  );
}
