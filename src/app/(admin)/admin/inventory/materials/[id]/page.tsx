import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MaterialForm } from "../MaterialForm";
import { StockLotDeleteButton } from "./StockLotDeleteButton";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const m = await prisma.rawMaterial.findUnique({ where: { id }, select: { name: true } });
  return { title: `${m?.name ?? "Material"} — ILLUMYNAT Admin` };
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;

  const [material, stockLots] = await Promise.all([
    prisma.rawMaterial.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true,
        consumptionUnit: true, purchaseUnit: true,
        conversionFactor: true, reorderThreshold: true, isActive: true,
        currentStock: true, averageCost: true,
      },
    }),
    prisma.stockLot.findMany({
      where: { rawMaterialId: id },
      orderBy: { receivedAt: "desc" },
      take: 20,
      select: {
        id: true,
        quantityPurchased: true,
        costPerPurchaseUnit: true,
        quantityReceived: true,
        totalCost: true,
        avgCostBefore: true,
        avgCostAfter: true,
        supplier: true,
        notes: true,
        receivedAt: true,
      },
    }),
  ]);

  if (!material) notFound();

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/admin/inventory?tab=materials"
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
          >
            ← Inventory
          </Link>
          <h1 className="font-display text-4xl font-light italic text-text">{material.name}</h1>
          <p className="font-body text-sm text-text-muted mt-1">
            {toNum(material.currentStock).toFixed(4)} {material.consumptionUnit.toLowerCase()} on hand
            {" · "}avg cost ${toNum(material.averageCost).toFixed(6)}/{material.consumptionUnit.toLowerCase()}
          </p>
        </div>
        <Link
          href={`/admin/inventory/stock-in?materialId=${material.id}`}
          className="px-5 py-2.5 bg-text text-text-inverse font-body text-[11px] tracking-[0.12em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
        >
          Receive Stock
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Edit form */}
        <div>
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
            Material Settings
          </p>
          <MaterialForm
            materialId={material.id}
            initial={{
              name:             material.name,
              description:      material.description ?? "",
              consumptionUnit:  material.consumptionUnit,
              purchaseUnit:     material.purchaseUnit,
              conversionFactor: toNum(material.conversionFactor).toString(),
              reorderThreshold: toNum(material.reorderThreshold).toString(),
              isActive:         material.isActive,
            }}
          />
        </div>

        {/* Stock lot history */}
        <div>
          <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
            Receipt History
          </p>
          {stockLots.length === 0 ? (
            <div className="bg-surface border border-border-subtle p-6">
              <p className="font-body text-sm text-text-muted">No stock received yet.</p>
              <Link
                href={`/admin/inventory/stock-in?materialId=${material.id}`}
                className="inline-block mt-3 font-body text-[11px] tracking-[0.1em] uppercase text-accent hover:underline"
              >
                Receive first stock →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stockLots.map((lot) => (
                <div key={lot.id} className="bg-surface border border-border-subtle p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-body text-sm text-text font-medium">
                        {toNum(lot.quantityReceived).toFixed(4)} {material.consumptionUnit.toLowerCase()}
                      </p>
                      <p className="font-body text-[11px] text-text-muted">
                        {toNum(lot.quantityPurchased).toFixed(4)} {material.purchaseUnit.toLowerCase()}
                        {" · "}${toNum(lot.costPerPurchaseUnit).toFixed(4)}/{material.purchaseUnit.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-body text-sm text-text">${toNum(lot.totalCost).toFixed(2)}</p>
                      <p className="font-body text-[11px] text-text-faint">
                        {new Date(lot.receivedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 font-body text-[10px] text-text-faint">
                      <span>avg ${toNum(lot.avgCostBefore).toFixed(6)} → ${toNum(lot.avgCostAfter).toFixed(6)}</span>
                      {lot.supplier && <span>· {lot.supplier}</span>}
                    </div>
                    <StockLotDeleteButton lotId={lot.id} />
                  </div>
                  {lot.notes && (
                    <p className="font-body text-[11px] text-text-muted mt-1 italic">{lot.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
