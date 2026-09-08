"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Ingredient {
  quantity: number;
  rawMaterial: { id: string; name: string; consumptionUnit: string; currentStock: number };
}

interface RecipeVersion {
  id: string;
  versionNumber: number;
  yieldQuantity: number;
  ingredients: Ingredient[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  recipe: { versions: RecipeVersion[] } | null;
}

interface Props { products: Product[] }

export function NewBatchForm({ products }: Props) {
  const router = useRouter();
  const [productId, setProductId]   = useState(products[0]?.id ?? "");
  const [quantity, setQuantity]     = useState("1");
  const [notes, setNotes]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const selected  = products.find((p) => p.id === productId);
  const recipe    = selected?.recipe?.versions[0] ?? null;

  // How many "runs" of the recipe does this quantity require?
  const targetQty = parseInt(quantity) || 0;
  const runs      = recipe ? Math.ceil(targetQty / recipe.yieldQuantity) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipe) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          recipeVersionId: recipe.id,
          targetQuantity: targetQty,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/admin/production/${data.batch.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 max-w-4xl">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-surface border border-border-subtle p-6 space-y-5">
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted pb-2 border-b border-border-subtle">
            Batch Details
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">
              Product *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          {recipe && (
            <p className="font-body text-[11px] text-text-muted bg-bg-subtle px-3 py-2 border border-border-subtle">
              Using recipe <span className="text-text">v{recipe.versionNumber}</span> · yields <span className="text-text">{recipe.yieldQuantity} units</span> per run
            </p>
          )}

          <Input
            label="Target Quantity (units)"
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Batch notes, special instructions…"
              className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
            />
          </div>
        </div>

        {error && (
          <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
        )}

        <div className="flex gap-4">
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!recipe || targetQty < 1}>
            Create Batch
          </Button>
          <Button href="/admin/production" variant="ghost" size="lg">Cancel</Button>
        </div>
      </div>

      {/* Material preview */}
      <div className="bg-surface border border-border-subtle p-6 h-fit">
        <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
          Materials Required
        </p>
        {!recipe ? (
          <p className="font-body text-sm text-text-muted">Select a product.</p>
        ) : recipe.ingredients.length === 0 ? (
          <p className="font-body text-sm text-text-muted">No ingredients in this recipe.</p>
        ) : (
          <div className="space-y-3">
            {recipe.ingredients.map((ing) => {
              const needed     = ing.quantity * runs;
              const available  = ing.rawMaterial.currentStock;
              const sufficient = available >= needed;
              return (
                <div key={ing.rawMaterial.id}>
                  <div className="flex justify-between items-start">
                    <p className="font-body text-sm text-text">{ing.rawMaterial.name}</p>
                    <p className={`font-body text-sm ${sufficient ? "text-text" : "text-error font-medium"}`}>
                      {needed.toFixed(2)} {ing.rawMaterial.consumptionUnit.toLowerCase()}
                    </p>
                  </div>
                  <p className={`font-body text-[11px] ${sufficient ? "text-text-muted" : "text-error"}`}>
                    {sufficient
                      ? `${available.toFixed(2)} available`
                      : `Only ${available.toFixed(2)} available — short by ${(needed - available).toFixed(2)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {recipe && targetQty > 0 && (
          <p className="font-body text-[11px] text-text-muted border-t border-border-subtle mt-4 pt-3">
            {runs} recipe run{runs !== 1 ? "s" : ""} · {runs * recipe.yieldQuantity} max yield
          </p>
        )}
      </div>
    </form>
  );
}
