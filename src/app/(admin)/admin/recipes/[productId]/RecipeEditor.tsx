"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface Material {
  id: string;
  name: string;
  consumptionUnit: string;
  currentStock: number;
  averageCost: number;
}

interface Ingredient {
  id?: string;
  rawMaterial: { id: string; name: string; consumptionUnit: string };
  quantity: number;
  notes: string | null;
}

interface Version {
  id: string;
  versionNumber: number;
  status: string;
  yieldQuantity: number;
  notes: string | null;
  activatedAt: Date | null;
  ingredients: Ingredient[];
}

interface Props {
  productId: string;
  recipeId: string | null;
  versions: Version[];
  materials: Material[];
}

const STATUS_CLS: Record<string, string> = {
  DRAFT:    "bg-warning/10 text-warning border-warning/20",
  ACTIVE:   "bg-success/10 text-success border-success/20",
  ARCHIVED: "bg-bg-subtle text-text-muted border-border",
};

export function RecipeEditor({ productId, recipeId: initialRecipeId, versions: initialVersions, materials }: Props) {
  const router = useRouter();
  const [versions, setVersions]       = useState<Version[]>(initialVersions);
  const [activeIdx, setActiveIdx]     = useState(initialVersions.length - 1 >= 0 ? initialVersions.length - 1 : 0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [recipeId, setRecipeId]       = useState(initialRecipeId);

  const version = versions[activeIdx] as Version | undefined;

  function updateVersion(field: "yieldQuantity" | "notes", value: string) {
    setVersions((vs) => vs.map((v, i) =>
      i !== activeIdx ? v : { ...v, [field]: field === "yieldQuantity" ? parseInt(value) || 1 : value }
    ));
  }

  function addIngredient() {
    const unused = materials.find(
      (m) => !version?.ingredients.some((ing) => ing.rawMaterial.id === m.id)
    );
    if (!unused || !version) return;
    setVersions((vs) => vs.map((v, i) =>
      i !== activeIdx ? v : {
        ...v,
        ingredients: [...v.ingredients, { rawMaterial: unused, quantity: 1, notes: "" }],
      }
    ));
  }

  function updateIngredient(ingIdx: number, field: string, value: string) {
    setVersions((vs) => vs.map((v, i) => {
      if (i !== activeIdx) return v;
      const ingredients = v.ingredients.map((ing, j) => {
        if (j !== ingIdx) return ing;
        if (field === "quantity")    return { ...ing, quantity: parseFloat(value) || 0 };
        if (field === "notes")       return { ...ing, notes: value };
        if (field === "rawMaterial") {
          const mat = materials.find((m) => m.id === value)!;
          return { ...ing, rawMaterial: { id: mat.id, name: mat.name, consumptionUnit: mat.consumptionUnit } };
        }
        return ing;
      });
      return { ...v, ingredients };
    }));
  }

  function removeIngredient(ingIdx: number) {
    setVersions((vs) => vs.map((v, i) =>
      i !== activeIdx ? v : { ...v, ingredients: v.ingredients.filter((_, j) => j !== ingIdx) }
    ));
  }

  async function handleSave() {
    if (!version) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/recipes/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          versionId:     version.id,
          yieldQuantity: version.yieldQuantity,
          notes:         version.notes || null,
          ingredients:   version.ingredients.map((ing) => ({
            rawMaterialId: ing.rawMaterial.id,
            quantity:      ing.quantity,
            notes:         ing.notes || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (data.recipeId) setRecipeId(data.recipeId);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewVersion() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${productId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, copyFromVersionId: version?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (data.recipeId) setRecipeId(data.recipeId);

      // Build the new version locally and add it to state immediately
      const newVersion: Version = {
        id:            data.version.id,
        versionNumber: data.version.versionNumber,
        status:        "DRAFT",
        yieldQuantity: version?.yieldQuantity ?? 1,
        notes:         null,
        activatedAt:   null,
        ingredients:   version
          ? version.ingredients.map((ing) => ({ ...ing }))
          : [],
      };
      setVersions((prev) => [...prev, newVersion]);
      setActiveIdx((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (!version) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${productId}/versions/${version.id}/activate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // Mark all versions as ARCHIVED, then set the current one as ACTIVE
      setVersions((prev) => prev.map((v, i) => ({
        ...v,
        status: i === activeIdx ? "ACTIVE" : v.status === "ACTIVE" ? "ARCHIVED" : v.status,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (versions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border border-border-subtle p-8 text-center max-w-lg">
          <p className="font-display text-xl font-light text-text-muted mb-2">No recipe yet</p>
          <p className="font-body text-sm text-text-muted mb-5">Create the first version to start adding ingredients.</p>
          <button
            onClick={handleNewVersion}
            disabled={loading}
            className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Recipe v1"}
          </button>
        </div>
        {error && <p className="font-body text-sm text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {versions.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
              activeIdx === i
                ? "bg-accent text-text-on-gold border-accent"
                : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
            )}
          >
            v{v.versionNumber}
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 border",
              STATUS_CLS[v.status] ?? ""
            )}>
              {v.status}
            </span>
          </button>
        ))}
        <button
          onClick={handleNewVersion}
          disabled={loading}
          className="px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors duration-150 disabled:opacity-50"
        >
          + New Version
        </button>
      </div>

      {version && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — ingredients */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-surface border border-border-subtle p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                  Ingredients — v{version.versionNumber}
                </p>
                <div className="flex items-center gap-3">
                  {version.status !== "ACTIVE" && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={loading || version.ingredients.length === 0}
                      title={version.ingredients.length === 0 ? "Add and save ingredients first" : undefined}
                      className="font-body text-[10px] tracking-widest uppercase text-success hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Active
                    </button>
                  )}
                  <span className={cn(
                    "font-body text-[10px] tracking-widest uppercase border px-2 py-0.5",
                    STATUS_CLS[version.status] ?? ""
                  )}>
                    {version.status}
                  </span>
                </div>
              </div>

              {/* Yield */}
              <div className="flex items-center gap-4">
                <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle shrink-0">
                  Yield (units per run)
                </label>
                <input
                  type="number"
                  min="1"
                  value={version.yieldQuantity}
                  onChange={(e) => updateVersion("yieldQuantity", e.target.value)}
                  className="w-24 bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200 text-center"
                />
              </div>

              {/* Ingredients list */}
              {version.ingredients.length === 0 && (
                <p className="font-body text-sm text-text-muted">No ingredients yet — add one below.</p>
              )}
              <div className="space-y-3">
                {version.ingredients.map((ing, ingIdx) => (
                  <div key={ingIdx} className="flex items-center gap-3">
                    <select
                      value={ing.rawMaterial.id}
                      onChange={(e) => updateIngredient(ingIdx, "rawMaterial", e.target.value)}
                      className="flex-1 bg-bg border border-border px-3 py-2.5 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(ingIdx, "quantity", e.target.value)}
                      className="w-24 bg-bg border border-border px-3 py-2.5 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200 text-center"
                    />
                    <span className="font-body text-[11px] text-text-muted w-16 shrink-0">
                      {ing.rawMaterial.consumptionUnit.toLowerCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingIdx)}
                      className="font-body text-[11px] uppercase text-error/60 hover:text-error transition-colors duration-150 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {version.ingredients.length < materials.length && (
                <button
                  type="button"
                  onClick={addIngredient}
                  className="font-body text-[11px] tracking-[0.12em] uppercase text-accent hover:underline"
                >
                  + Add Ingredient
                </button>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle">
                <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle">Version Notes</label>
                <textarea
                  value={version.notes ?? ""}
                  onChange={(e) => updateVersion("notes", e.target.value)}
                  rows={2}
                  placeholder="Changes from previous version, testing notes…"
                  className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-y"
                />
              </div>
            </div>

            {error && (
              <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className={cn(
                "px-6 py-2.5 font-body text-[11px] tracking-[0.15em] uppercase transition-all duration-200",
                saved
                  ? "bg-success text-text-inverse border border-success"
                  : "bg-accent text-text-on-gold hover:opacity-90 disabled:opacity-50"
              )}
            >
              {loading ? "Saving…" : saved ? "Saved ✓" : "Save Recipe"}
            </button>
          </div>

          {/* Right — cost + stock preview */}
          <div className="space-y-4">
            {/* Cost card */}
            <div className="bg-surface border border-border-subtle p-6 space-y-4">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                Cost per Unit
              </p>
              {version.ingredients.length === 0 ? (
                <p className="font-body text-sm text-text-muted">Add ingredients to calculate cost.</p>
              ) : (() => {
                const totalBatchCost = version.ingredients.reduce((sum, ing) => {
                  const mat = materials.find((m) => m.id === ing.rawMaterial.id);
                  return sum + ing.quantity * (mat?.averageCost ?? 0);
                }, 0);
                const yieldQty = version.yieldQuantity || 1;
                const costPerUnit = totalBatchCost / yieldQty;
                return (
                  <div className="space-y-3">
                    {version.ingredients.map((ing, i) => {
                      const mat = materials.find((m) => m.id === ing.rawMaterial.id);
                      const lineCost = ing.quantity * (mat?.averageCost ?? 0);
                      return (
                        <div key={i} className="flex justify-between font-body text-sm">
                          <span className="text-text-muted truncate">{ing.rawMaterial.name}</span>
                          <span className="text-text shrink-0 ml-2">${lineCost.toFixed(4)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-border-subtle pt-3 space-y-1">
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-text-muted">Batch total</span>
                        <span className="text-text">${totalBatchCost.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between font-body text-sm font-medium">
                        <span className="text-text">Cost / unit ({yieldQty} yield)</span>
                        <span className="text-accent">${costPerUnit.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Stock preview */}
            <div className="bg-surface border border-border-subtle p-6 space-y-4">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                Stock Preview
              </p>
              {version.ingredients.length === 0 ? (
                <p className="font-body text-sm text-text-muted">Add ingredients to see stock levels.</p>
              ) : (
                <div className="space-y-3">
                  {version.ingredients.map((ing, ingIdx) => {
                    const mat        = materials.find((m) => m.id === ing.rawMaterial.id);
                    const stock      = mat?.currentStock ?? 0;
                    const runsCanDo  = ing.quantity > 0 ? Math.floor(stock / ing.quantity) : "∞";
                    const isLow      = typeof runsCanDo === "number" && runsCanDo < 5;
                    return (
                      <div key={ingIdx}>
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-text truncate">{ing.rawMaterial.name}</span>
                          <span className={isLow ? "text-warning font-medium" : "text-text-muted"}>
                            {stock.toFixed(2)} {ing.rawMaterial.consumptionUnit.toLowerCase()}
                          </span>
                        </div>
                        <p className={`font-body text-[11px] ${isLow ? "text-warning" : "text-text-muted"}`}>
                          {typeof runsCanDo === "number"
                            ? `${runsCanDo} run${runsCanDo !== 1 ? "s" : ""} possible`
                            : "Unlimited runs"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
