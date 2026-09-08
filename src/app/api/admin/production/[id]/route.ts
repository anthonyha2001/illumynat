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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, actualQuantity, failedQuantity } = await req.json();

    const batch = await prisma.productionBatch.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        productId: true,
        targetQuantity: true,
        recipeVersion: {
          select: {
            yieldQuantity: true,
            ingredients: {
              select: {
                quantity: true,
                rawMaterial: { select: { id: true, averageCost: true, currentStock: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    if (action === "start") {
      if (batch.status !== "PENDING") {
        return NextResponse.json({ error: "Batch must be PENDING to start" }, { status: 400 });
      }
      await prisma.productionBatch.update({
        where: { id },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel") {
      if (batch.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot cancel a completed batch" }, { status: 400 });
      }
      await prisma.productionBatch.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "complete") {
      if (batch.status !== "IN_PROGRESS") {
        return NextResponse.json({ error: "Batch must be IN_PROGRESS to complete" }, { status: 400 });
      }

      const actual  = typeof actualQuantity  === "number" ? actualQuantity  : batch.targetQuantity;
      const failed  = typeof failedQuantity  === "number" ? failedQuantity  : 0;
      const runs    = Math.ceil(batch.targetQuantity / batch.recipeVersion.yieldQuantity);

      // Compute deductions and costs
      let totalMaterialCost = 0;
      const deductions = batch.recipeVersion.ingredients.map((ing) => {
        const avgCost    = Number(ing.rawMaterial.averageCost);
        const qty        = Number(ing.quantity) * runs;
        const totalCost  = qty * avgCost;
        totalMaterialCost += totalCost;
        return {
          productionBatchId: id,
          rawMaterialId:     ing.rawMaterial.id,
          quantityDeducted:  qty,
          costPerUnit:       avgCost,
          totalCost,
        };
      });

      const costPerUnit = actual > 0 ? totalMaterialCost / actual : 0;

      await prisma.$transaction(async (tx) => {
        // 1. Deduct raw materials
        for (const ing of batch.recipeVersion.ingredients) {
          const qty = Number(ing.quantity) * runs;
          await tx.rawMaterial.update({
            where: { id: ing.rawMaterial.id },
            data: { currentStock: { decrement: qty } },
          });
        }

        // 2. Record deductions
        await tx.batchDeduction.createMany({ data: deductions });

        // 3. Update finished goods
        const fg = await tx.finishedGoods.findUnique({
          where: { productId: batch.productId },
          select: { quantityOnHand: true, averageCost: true },
        });

        if (fg) {
          const existingQty  = fg.quantityOnHand;
          const existingCost = Number(fg.averageCost);
          const newQty       = existingQty + actual;
          // Weighted average cost
          const newAvgCost   = newQty > 0
            ? (existingQty * existingCost + actual * costPerUnit) / newQty
            : costPerUnit;

          await tx.finishedGoods.update({
            where: { productId: batch.productId },
            data: { quantityOnHand: newQty, averageCost: newAvgCost },
          });
        }

        // 4. Mark batch complete
        await tx.productionBatch.update({
          where: { id },
          data: {
            status: "COMPLETED",
            actualQuantity: actual,
            failedQuantity: failed,
            totalMaterialCost,
            costPerUnit,
            completedAt: new Date(),
          },
        });
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/production PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
