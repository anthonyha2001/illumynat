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
  percentageOfWax: number | null;
  notes: string | null;
}

interface Version {
  id: string;
  versionNumber: number;
  status: string;
  waxWeight: number | null;
  yieldQuantity: number;
  notes: string | null;
  activatedAt: Date | null;
  ingredients: Ingredient[];
}

interface Props {
  recipeId: string;
  versions: Version[];
  materials: Material[];
}

const STATUS_CLS: Record<string, string> = {
  DRAFT:    "bg-warning/10 text-warning border-warning/20",
  ACTIVE:   "bg-success/10 text-success border-success/20",
  ARCHIVED: "bg-bg-subtle text-text-muted border-border",
};

function calcActualQty(ing: Ingredient, waxWeight: number | null): number {
  if (ing.percentageOfWax != null && waxWeight != null) {
    return (ing.percentageOfWax / 100) * waxWeight;
  }
  return ing.quantity;
}

export function RecipeEditor({ recipeId, versions: initialVersions, materials }: Props) {
  const router = useRouter();
  const [versions, setVersions]   = useState<Version[]>(initialVersions);
  const [activeIdx, setActiveIdx] = useState(initialVersions.length - 1 >= 0 ? initialVersions.length - 1 : 0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  const version = versions[activeIdx] as Version | undefined;

  function updateVersion(field: "waxWeight" | "yieldQuantity" | "notes", value: string) {
    setVersions((vs) => vs.map((v, i) => {
      if (i !== activeIdx) return v;
      if (field === "waxWeight")     return { ...v, waxWeight: value === "" ? null : parseFloat(value) || null };
      if (field === "yieldQuantity") return { ...v, yieldQuantity: parseInt(value) || 1 };
      return { ...v, notes: value };
    }));
  }

  function addIngredient() {
    const unused = materials.find(
      (m) => !version?.ingredients.some((ing) => ing.rawMaterial.id === m.id)
    );
    if (!unused || !version) return;
    setVersions((vs) => vs.map((v, i) =>
      i !== activeIdx ? v : {
        ...v,
        ingredients: [...v.ingredients, {
          rawMaterial: unused,
          quantity: 0,
          percentageOfWax: null,
          notes: "",
        }],
      }
    ));
  }

  function updateIngredient(ingIdx: number, field: string, value: string) {
    setVersions((vs) => vs.map((v, i) => {
      if (i !== activeIdx) return v;
      const ingredients = v.ingredients.map((ing, j) => {
        if (j !== ingIdx) return ing;
        switch (field) {
          case "rawMaterial": {
            const mat = materials.find((m) => m.id === value)!;
            return { ...ing, rawMaterial: { id: mat.id, name: mat.name, consumptionUnit: mat.consumptionUnit } };
          }
          case "percentageOfWax":
            return { ...ing, percentageOfWax: value === "" ? null : parseFloat(value) || null };
          case "quantity":
            return { ...ing, quantity: parseFloat(value) || 0 };
          case "notes":
            return { ...ing, notes: value };
          default:
            return ing;
        }
      });
      return { ...v, ingredients };
    }));
  }

  function toggleMode(ingIdx: number) {
    setVersions((vs) => vs.map((v, i) => {
      if (i !== activeIdx) return v;
      const ingredients = v.ingredients.map((ing, j) => {
        if (j !== ingIdx) return ing;
        if (ing.percentageOfWax != null) {
          // Switch to fixed: derive quantity from current percentage
          const qty = calcActualQty(ing, version?.waxWeight ?? null);
          return { ...ing, percentageOfWax: null, quantity: qty };
        } else {
          // Switch to % mode: derive percentage from current quantity and waxWeight
          const ww = version?.waxWeight;
          const pct = ww && ww > 0 ? (ing.quantity / ww) * 100 : 10;
          return { ...ing, percentageOfWax: parseFloat(pct.toFixed(4)), quantity: ing.quantity };
        }
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
      const res = await fetch(`/api/admin/recipes/${recipeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId:     version.id,
          waxWeight:     version.waxWeight,
          yieldQuantity: version.yieldQuantity,
          notes:         version.notes || null,
          ingredients:   version.ingredients.map((ing) => ({
            rawMaterialId:   ing.rawMaterial.id,
            quantity:        calcActualQty(ing, version.waxWeight),
            percentageOfWax: ing.percentageOfWax,
            notes:           ing.notes || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
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
      const res = await fetch(`/api/admin/recipes/${recipeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyFromVersionId: version?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const newVersion: Version = {
        id:            data.version.id,
        versionNumber: data.version.versionNumber,
        status:        "DRAFT",
        waxWeight:     version?.waxWeight ?? null,
        yieldQuantity: version?.yieldQuantity ?? 1,
        notes:         null,
        activatedAt:   null,
        ingredients:   version ? version.ingredients.map((ing) => ({ ...ing })) : [],
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
      const res = await fetch(`/api/admin/recipes/${recipeId}/versions/${version.id}/activate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
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
          <p className="font-display text-xl font-light text-text-muted mb-2">No versions yet</p>
          <p className="font-body text-sm text-text-muted mb-5">Create the first version to start building the formula.</p>
          <button
            onClick={handleNewVersion}
            disabled={loading}
            className="px-5 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create v1"}
          </button>
        </div>
        {error && <p className="font-body text-sm text-error">{error}</p>}
      </div>
    );
  }

  const totalBatchCost = version?.ingredients.reduce((sum, ing) => {
    const mat = materials.find((m) => m.id === ing.rawMaterial.id);
    const qty = calcActualQty(ing, version.waxWeight);
    return sum + qty * (mat?.averageCost ?? 0);
  }, 0) ?? 0;
  const costPerUnit = totalBatchCost / (version?.yieldQuantity || 1);

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
            <span className={cn("text-[9px] px-1.5 py-0.5 border", STATUS_CLS[v.status] ?? "")}>
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
          {/* Left — formula */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-surface border border-border-subtle p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                  Formula — v{version.versionNumber}
                </p>
                <div className="flex items-center gap-3">
                  {version.status !== "ACTIVE" && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={loading || version.ingredients.length === 0}
                      title={version.ingredients.length === 0 ? "Add ingredients first" : undefined}
                      className="font-body text-[10px] tracking-widest uppercase text-success hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Active
                    </button>
                  )}
                  <span className={cn("font-body text-[10px] tracking-widest uppercase border px-2 py-0.5", STATUS_CLS[version.status] ?? "")}>
                    {version.status}
                  </span>
                </div>
              </div>

              {/* Wax weight + yield */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle">
                    Wax Weight (g)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 200"
                      value={version.waxWeight ?? ""}
                      onChange={(e) => updateVersion("waxWeight", e.target.value)}
                      className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
                    />
                    <span className="font-body text-[11px] text-text-muted shrink-0">g</span>
                  </div>
                  {version.waxWeight && (
                    <p className="font-body text-[10px] text-text-faint">
                      Ingredient %s scale from this weight
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle">
                    Yield (units / run)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={version.yieldQuantity}
                    onChange={(e) => updateVersion("yieldQuantity", e.target.value)}
                    className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200 text-center"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-1 pt-1 border-t border-border-subtle">
                <div className="grid grid-cols-[1fr_120px_80px_60px_auto] gap-2 pb-1">
                  <p className="font-body text-[9px] tracking-[0.15em] uppercase text-text-faint">Ingredient</p>
                  <p className="font-body text-[9px] tracking-[0.15em] uppercase text-text-faint">Amount</p>
                  <p className="font-body text-[9px] tracking-[0.15em] uppercase text-text-faint">Mode</p>
                  <p className="font-body text-[9px] tracking-[0.15em] uppercase text-text-faint">Actual</p>
                  <span />
                </div>

                {version.ingredients.length === 0 && (
                  <p className="font-body text-sm text-text-muted py-2">No ingredients yet.</p>
                )}

                {version.ingredients.map((ing, ingIdx) => {
                  const isPercent = ing.percentageOfWax != null;
                  const actual    = calcActualQty(ing, version.waxWeight);
                  return (
                    <div key={ingIdx} className="grid grid-cols-[1fr_120px_80px_60px_auto] gap-2 items-center">
                      <select
                        value={ing.rawMaterial.id}
                        onChange={(e) => updateIngredient(ingIdx, "rawMaterial", e.target.value)}
                        className="bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={isPercent ? (ing.percentageOfWax ?? "") : ing.quantity}
                          onChange={(e) => updateIngredient(ingIdx, isPercent ? "percentageOfWax" : "quantity", e.target.value)}
                          className="w-full bg-bg border border-border px-2 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200 text-right"
                        />
                        <span className="font-body text-[10px] text-text-muted shrink-0 w-6">
                          {isPercent ? "%" : ing.rawMaterial.consumptionUnit.slice(0, 2).toLowerCase()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMode(ingIdx)}
                        title={isPercent ? "Switch to fixed quantity" : "Switch to % of wax"}
                        className={cn(
                          "px-2 py-1.5 font-body text-[9px] tracking-widest uppercase border transition-colors duration-150",
                          isPercent
                            ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                            : "bg-bg-subtle text-text-muted border-border hover:border-accent hover:text-accent"
                        )}
                      >
                        {isPercent ? "% wax" : "fixed"}
                      </button>

                      <span className={cn(
                        "font-body text-[11px] text-right tabular-nums",
                        isPercent && version.waxWeight ? "text-text" : "text-text-faint"
                      )}>
                        {isPercent
                          ? (version.waxWeight ? `${actual.toFixed(2)}g` : "—")
                          : `${actual.toFixed(2)}`
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() => removeIngredient(ingIdx)}
                        className="font-body text-[11px] uppercase text-error/60 hover:text-error transition-colors duration-150"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
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

          {/* Right — cost + stock */}
          <div className="space-y-4">
            <div className="bg-surface border border-border-subtle p-6 space-y-4">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                Cost per Unit
              </p>
              {!version.waxWeight && version.ingredients.some((i) => i.percentageOfWax != null) && (
                <p className="font-body text-xs text-warning bg-warning/5 border border-warning/20 px-3 py-2">
                  Set wax weight to calculate costs for % ingredients.
                </p>
              )}
              {version.ingredients.length === 0 ? (
                <p className="font-body text-sm text-text-muted">Add ingredients to calculate cost.</p>
              ) : (
                <div className="space-y-3">
                  {version.ingredients.map((ing, i) => {
                    const mat     = materials.find((m) => m.id === ing.rawMaterial.id);
                    const qty     = calcActualQty(ing, version.waxWeight);
                    const lineCost = qty * (mat?.averageCost ?? 0);
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
                      <span className="text-text">Cost / unit ({version.yieldQuantity} yield)</span>
                      <span className="text-accent">${costPerUnit.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-surface border border-border-subtle p-6 space-y-4">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
                Stock Preview
              </p>
              {version.ingredients.length === 0 ? (
                <p className="font-body text-sm text-text-muted">Add ingredients to see stock.</p>
              ) : (
                <div className="space-y-3">
                  {version.ingredients.map((ing, ingIdx) => {
                    const mat       = materials.find((m) => m.id === ing.rawMaterial.id);
                    const stock     = mat?.currentStock ?? 0;
                    const qty       = calcActualQty(ing, version.waxWeight);
                    const runsCanDo = qty > 0 ? Math.floor(stock / qty) : Infinity;
                    const isLow     = isFinite(runsCanDo) && runsCanDo < 5;
                    return (
                      <div key={ingIdx}>
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-text truncate">{ing.rawMaterial.name}</span>
                          <span className={isLow ? "text-warning font-medium" : "text-text-muted"}>
                            {stock.toFixed(2)} {ing.rawMaterial.consumptionUnit.toLowerCase()}
                          </span>
                        </div>
                        <p className={`font-body text-[11px] ${isLow ? "text-warning" : "text-text-muted"}`}>
                          {isFinite(runsCanDo)
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
