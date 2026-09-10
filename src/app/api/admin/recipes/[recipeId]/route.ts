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

// Save a recipe version's ingredients + waxWeight
export async function POST(req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipeId } = await params;
    const { versionId, waxWeight, yieldQuantity, notes, ingredients } = await req.json();

    await prisma.$transaction(async (tx) => {
      // Update version fields
      await tx.recipeVersion.update({
        where: { id: versionId },
        data: {
          waxWeight:     waxWeight != null ? waxWeight : null,
          yieldQuantity: yieldQuantity ?? 1,
          notes:         notes ?? null,
        },
      });

      // Replace ingredients
      await tx.recipeIngredient.deleteMany({ where: { recipeVersionId: versionId } });
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing: {
            rawMaterialId: string;
            quantity: number;
            percentageOfWax: number | null;
            notes: string | null;
          }) => ({
            recipeVersionId: versionId,
            rawMaterialId:   ing.rawMaterialId,
            quantity:        ing.quantity,
            percentageOfWax: ing.percentageOfWax ?? null,
            notes:           ing.notes ?? null,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true, recipeId });
  } catch (err) {
    console.error("[admin/recipes/[recipeId] POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
