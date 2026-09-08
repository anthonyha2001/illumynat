"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Material {
  id: string;
  name: string;
  purchaseUnit: string;
  consumptionUnit: string;
  conversionFactor: number;
  currentStock: number;
  averageCost: number;
}

interface Props {
  materials: Material[];
  defaultMaterialId?: string;
}

export function StockInForm({ materials, defaultMaterialId }: Props) {
  const router = useRouter();

  const [materialId, setMaterialId]     = useState(defaultMaterialId ?? "");
  const [qtyPurchased, setQtyPurchased] = useState("");
  const [costPerUnit, setCostPerUnit]   = useState("");
  const [supplier, setSupplier]         = useState("");
  const [notes, setNotes]               = useState("");
  const [receivedAt, setReceivedAt]     = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const material = useMemo(
    () => materials.find((m) => m.id === materialId) ?? null,
    [materials, materialId]
  );

  const qty        = parseFloat(qtyPurchased) || 0;
  const cost       = parseFloat(costPerUnit)  || 0;
  const qtyReceived = material ? qty * material.conversionFactor : 0;
  const totalCost   = qty * cost;
  const costPerConsumptionUnit = material && material.conversionFactor > 0
    ? cost / material.conversionFactor
    : 0;
  const newStock    = material ? material.currentStock + qtyReceived : 0;
  const newAvgCost  = material && newStock > 0
    ? (material.currentStock * material.averageCost + qtyReceived * costPerConsumptionUnit) / newStock
    : costPerConsumptionUnit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) { setError("Select a material."); return; }
    if (!qty || qty <= 0) { setError("Quantity must be greater than zero."); return; }
    if (!cost || cost <= 0) { setError("Cost per unit must be greater than zero."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          quantityPurchased:   qty,
          costPerPurchaseUnit: cost,
          supplier:  supplier.trim()  || null,
          notes:     notes.trim()     || null,
          receivedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/admin/inventory/materials/${materialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Material selector */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Raw Material <span className="text-accent">*</span>
        </label>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          required
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
        >
          <option value="">Select material…</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.currentStock.toFixed(2)} {m.consumptionUnit.toLowerCase()} on hand
            </option>
          ))}
        </select>
      </div>

      {material && (
        <div className="bg-bg-subtle border border-border-subtle px-4 py-3 space-y-1">
          <p className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-muted">
            Current Stock
          </p>
          <p className="font-body text-sm text-text">
            {material.currentStock.toFixed(4)} {material.consumptionUnit.toLowerCase()}
            {" · "}avg cost ${material.averageCost.toFixed(4)}/{material.consumptionUnit.toLowerCase()}
          </p>
          <p className="font-body text-[11px] text-text-faint">
            1 {material.purchaseUnit.toLowerCase()} = {material.conversionFactor} {material.consumptionUnit.toLowerCase()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Quantity purchased */}
        <div className="space-y-1.5">
          <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
            Qty Purchased <span className="text-accent">*</span>
            {material && (
              <span className="normal-case tracking-normal text-text-faint ml-1">
                ({material.purchaseUnit.toLowerCase()})
              </span>
            )}
          </label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            value={qtyPurchased}
            onChange={(e) => setQtyPurchased(e.target.value)}
            placeholder="0.00"
            required
            className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
          />
        </div>

        {/* Cost per purchase unit */}
        <div className="space-y-1.5">
          <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
            Cost / Purchase Unit <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-text-muted">$</span>
            <input
              type="number"
              step="0.000001"
              min="0.000001"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="0.00"
              required
              className="w-full bg-bg border border-border pl-6 pr-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {material && qty > 0 && cost > 0 && (
        <div className="bg-surface border border-border-subtle p-4 space-y-2">
          <p className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-muted mb-3">
            Receipt Preview
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-body text-sm">
            {[
              { label: "Qty Received",     value: `${qtyReceived.toFixed(4)} ${material.consumptionUnit.toLowerCase()}` },
              { label: "Total Cost",       value: `$${totalCost.toFixed(2)}` },
              { label: "Cost / Consumption Unit", value: `$${costPerConsumptionUnit.toFixed(6)}` },
              { label: "New Stock",        value: `${newStock.toFixed(4)} ${material.consumptionUnit.toLowerCase()}` },
              { label: "Avg Cost Before",  value: `$${material.averageCost.toFixed(6)}` },
              { label: "Avg Cost After",   value: `$${newAvgCost.toFixed(6)}` },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] tracking-[0.08em] uppercase text-text-faint">{row.label}</p>
                <p className="text-text font-medium">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Supplier <span className="text-text-faint normal-case tracking-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="e.g. CandleScience"
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {/* Received at */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Received On
        </label>
        <input
          type="date"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
          required
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
          Notes <span className="text-text-faint normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="PO number, batch info, quality notes…"
          className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-none"
        />
      </div>

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-text text-text-inverse font-body text-[11px] tracking-[0.15em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Receive Stock"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border text-text-muted font-body text-[11px] tracking-[0.12em] uppercase hover:border-text-muted transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
