import { prisma } from "@/lib/prisma";
import { StockInForm } from "./StockInForm";

export const metadata = { title: "Receive Stock — LUMYNAT Admin" };

interface Props {
  searchParams: Promise<{ materialId?: string }>;
}

export default async function StockInPage({ searchParams }: Props) {
  const { materialId } = await searchParams;

  const materials = await prisma.rawMaterial.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      purchaseUnit: true,
      consumptionUnit: true,
      conversionFactor: true,
      currentStock: true,
      averageCost: true,
    },
  });

  function toNum(v: unknown): number {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseFloat(v) || 0;
    if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
      return (v as { toNumber: () => number }).toNumber();
    }
    return 0;
  }

  const serialized = materials.map((m) => ({
    ...m,
    conversionFactor: toNum(m.conversionFactor),
    currentStock:     toNum(m.currentStock),
    averageCost:      toNum(m.averageCost),
  }));

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Inventory</p>
        <h1 className="font-display text-4xl font-light italic text-text">Receive Stock</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Record incoming raw material inventory. Updates on-hand quantity and weighted average cost.
        </p>
      </div>
      <StockInForm materials={serialized} defaultMaterialId={materialId} />
    </div>
  );
}
