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

// Save (upsert) a recipe version's ingredients
export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await params;
    const { recipeId: existingRecipeId, versionId, yieldQuantity, notes, ingredients } = await req.json();

    let recipeId = existingRecipeId;

    await prisma.$transaction(async (tx) => {
      // Ensure Recipe exists
      if (!recipeId) {
        const recipe = await tx.recipe.create({ data: { productId }, select: { id: true } });
        recipeId = recipe.id;
      }

      // Update version fields
      await tx.recipeVersion.update({
        where: { id: versionId },
        data: { yieldQuantity, notes: notes ?? null },
      });

      // Replace ingredients
      await tx.recipeIngredient.deleteMany({ where: { recipeVersionId: versionId } });
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing: { rawMaterialId: string; quantity: number; notes: string | null }) => ({
            recipeVersionId: versionId,
            rawMaterialId:   ing.rawMaterialId,
            quantity:        ing.quantity,
            notes:           ing.notes ?? null,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true, recipeId });
  } catch (err) {
    console.error("[admin/recipes POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
