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

// Create a new recipe version (optionally copying from an existing one)
export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await params;
    const { recipeId: existingRecipeId, copyFromVersionId } = await req.json();

    let recipeId = existingRecipeId;

    const result = await prisma.$transaction(async (tx) => {
      // Ensure Recipe exists
      if (!recipeId) {
        const recipe = await tx.recipe.upsert({
          where: { productId },
          create: { productId },
          update: {},
          select: { id: true },
        });
        recipeId = recipe.id;
      }

      // Get next version number
      const latest = await tx.recipeVersion.findFirst({
        where: { recipeId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const nextNumber = (latest?.versionNumber ?? 0) + 1;

      // Create new version
      const newVersion = await tx.recipeVersion.create({
        data: {
          recipeId,
          versionNumber: nextNumber,
          status: "DRAFT",
          yieldQuantity: 1,
        },
        select: { id: true, versionNumber: true },
      });

      // Copy ingredients if requested
      if (copyFromVersionId) {
        const sourceIngredients = await tx.recipeIngredient.findMany({
          where: { recipeVersionId: copyFromVersionId },
          select: { rawMaterialId: true, quantity: true, notes: true },
        });
        if (sourceIngredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: sourceIngredients.map((ing) => ({
              recipeVersionId: newVersion.id,
              rawMaterialId:   ing.rawMaterialId,
              quantity:        ing.quantity,
              notes:           ing.notes,
            })),
          });
        }

        // Copy yield from source
        const sourceVersion = await tx.recipeVersion.findUnique({
          where: { id: copyFromVersionId },
          select: { yieldQuantity: true },
        });
        if (sourceVersion) {
          await tx.recipeVersion.update({
            where: { id: newVersion.id },
            data: { yieldQuantity: sourceVersion.yieldQuantity },
          });
        }
      }

      return { newVersion, recipeId };
    });

    return NextResponse.json({ ok: true, recipeId: result.recipeId, version: result.newVersion }, { status: 201 });
  } catch (err) {
    console.error("[admin/recipes/versions POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
