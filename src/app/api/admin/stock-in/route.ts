import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      materialId,
      quantityPurchased,
      costPerPurchaseUnit,
      supplier,
      notes,
      receivedAt,
    } = await req.json();

    if (!materialId)            return NextResponse.json({ error: "Material is required" }, { status: 400 });
    if (!quantityPurchased || quantityPurchased <= 0)
      return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
    if (!costPerPurchaseUnit || costPerPurchaseUnit <= 0)
      return NextResponse.json({ error: "Cost must be greater than zero" }, { status: 400 });

    const material = await prisma.rawMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, conversionFactor: true, currentStock: true, averageCost: true },
    });
    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    const conversionFactor   = toNum(material.conversionFactor);
    const currentStock       = toNum(material.currentStock);
    const currentAvgCost     = toNum(material.averageCost);

    // Derived values
    const quantityReceived      = quantityPurchased * conversionFactor;
    const costPerUnit           = conversionFactor > 0 ? costPerPurchaseUnit / conversionFactor : costPerPurchaseUnit;
    const totalCost             = quantityPurchased * costPerPurchaseUnit;
    const newStock              = currentStock + quantityReceived;
    const newAvgCost            = newStock > 0
      ? (currentStock * currentAvgCost + quantityReceived * costPerUnit) / newStock
      : costPerUnit;

    const stockLot = await prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.create({
        data: {
          rawMaterialId:       materialId,
          quantityPurchased,
          costPerPurchaseUnit,
          quantityReceived,
          costPerUnit,
          totalCost,
          avgCostBefore: currentAvgCost,
          avgCostAfter:  newAvgCost,
          supplier:      supplier  ?? null,
          notes:         notes     ?? null,
          receivedAt:    receivedAt ? new Date(receivedAt) : new Date(),
        },
        select: { id: true },
      });

      await tx.rawMaterial.update({
        where: { id: materialId },
        data:  { currentStock: newStock, averageCost: newAvgCost },
      });

      return lot;
    });

    return NextResponse.json({ stockLot }, { status: 201 });
  } catch (err) {
    console.error("[stock-in POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
