"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface Shipment {
  carrier:           string | null;
  trackingNumber:    string | null;
  estimatedDelivery: Date   | null;
  notes:             string | null;
  shippedAt:         Date;
}

interface Props {
  orderId:  string;
  shipment: Shipment | null;
}

const CARRIERS = [
  "UPS", "USPS", "FedEx", "DHL", "OnTrac", "LaserShip", "Other",
];

export function ShipmentPanel({ orderId, shipment }: Props) {
  const router = useRouter();

  const [carrier, setCarrier]         = useState(shipment?.carrier ?? "");
  const [tracking, setTracking]       = useState(shipment?.trackingNumber ?? "");
  const [estDelivery, setEstDelivery] = useState(
    shipment?.estimatedDelivery
      ? new Date(shipment.estimatedDelivery).toISOString().split("T")[0]
      : ""
  );
  const [notes, setNotes]   = useState(shipment?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isDirty =
    carrier   !== (shipment?.carrier ?? "") ||
    tracking  !== (shipment?.trackingNumber ?? "") ||
    estDelivery !== (shipment?.estimatedDelivery
      ? new Date(shipment.estimatedDelivery).toISOString().split("T")[0]
      : "") ||
    notes !== (shipment?.notes ?? "");

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier:           carrier.trim()   || null,
          trackingNumber:    tracking.trim()  || null,
          estimatedDelivery: estDelivery      || null,
          notes:             notes.trim()     || null,
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

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
          Shipment Tracking
        </p>
        {shipment && (
          <span className="font-body text-[10px] text-text-faint">
            Shipped {new Date(shipment.shippedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Carrier */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] tracking-[0.08em] uppercase text-text-faint block">Carrier</label>
        <div className="flex flex-wrap gap-1">
          {CARRIERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCarrier(c === carrier ? "" : c)}
              className={cn(
                "px-2.5 py-1 font-body text-[10px] tracking-[0.06em] border transition-colors duration-150",
                carrier === c
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tracking number */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] tracking-[0.08em] uppercase text-text-faint block">
          Tracking Number
        </label>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="1Z999AA10123456784"
          className="w-full bg-bg border border-border px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {/* Estimated delivery */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] tracking-[0.08em] uppercase text-text-faint block">
          Estimated Delivery
        </label>
        <input
          type="date"
          value={estDelivery}
          onChange={(e) => setEstDelivery(e.target.value)}
          className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="font-body text-[11px] tracking-[0.08em] uppercase text-text-faint block">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Left with neighbour"
          className="w-full bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 resize-none"
        />
      </div>

      {error && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading || !isDirty}
        className={cn(
          "w-full py-2.5 font-body text-[11px] tracking-[0.15em] uppercase transition-all duration-200",
          saved
            ? "bg-success text-text-inverse border border-success"
            : isDirty
            ? "bg-accent text-text-on-gold border border-accent hover:opacity-90"
            : "bg-bg-subtle text-text-muted border border-border cursor-not-allowed"
        )}
      >
        {loading ? "Saving…" : saved ? "Saved ✓" : shipment ? "Update Tracking" : "Save Tracking"}
      </button>

      {/* Tracking link if tracking number present */}
      {shipment?.trackingNumber && (
        <p className="font-body text-[11px] text-text-faint">
          Tracking:{" "}
          <span className="font-mono text-text-muted select-all">{shipment.trackingNumber}</span>
        </p>
      )}
    </div>
  );
}
