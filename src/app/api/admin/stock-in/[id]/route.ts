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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const lot = await prisma.stockLot.findUnique({
      where: { id },
      select: {
        id: true,
        rawMaterialId: true,
        quantityReceived: true,
        avgCostBefore: true,
      },
    });

    if (!lot) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

    const material = await prisma.rawMaterial.findUnique({
      where: { id: lot.rawMaterialId },
      select: { currentStock: true },
    });

    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    const quantityReceived = toNum(lot.quantityReceived);
    const newStock = Math.max(0, toNum(material.currentStock) - quantityReceived);
    const restoredAvgCost = newStock === 0 ? 0 : toNum(lot.avgCostBefore);

    await prisma.$transaction([
      prisma.stockLot.delete({ where: { id } }),
      prisma.rawMaterial.update({
        where: { id: lot.rawMaterialId },
        data: { currentStock: newStock, averageCost: restoredAvgCost },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stock-in DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
