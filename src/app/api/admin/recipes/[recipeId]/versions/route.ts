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

// Create a new version (optionally copying from an existing one)
export async function POST(req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipeId } = await params;
    const { copyFromVersionId } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const latest = await tx.recipeVersion.findFirst({
        where: { recipeId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true, yieldQuantity: true, waxWeight: true },
      });
      const nextNumber = (latest?.versionNumber ?? 0) + 1;

      const newVersion = await tx.recipeVersion.create({
        data: {
          recipeId,
          versionNumber: nextNumber,
          status:        "DRAFT",
          yieldQuantity: latest?.yieldQuantity ?? 1,
          waxWeight:     latest?.waxWeight ?? null,
        },
        select: { id: true, versionNumber: true },
      });

      if (copyFromVersionId) {
        const sourceIngredients = await tx.recipeIngredient.findMany({
          where: { recipeVersionId: copyFromVersionId },
          select: { rawMaterialId: true, quantity: true, percentageOfWax: true, notes: true },
        });
        if (sourceIngredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: sourceIngredients.map((ing) => ({
              recipeVersionId: newVersion.id,
              rawMaterialId:   ing.rawMaterialId,
              quantity:        ing.quantity,
              percentageOfWax: ing.percentageOfWax,
              notes:           ing.notes,
            })),
          });
        }
      }

      return newVersion;
    });

    return NextResponse.json({ ok: true, recipeId, version: result }, { status: 201 });
  } catch (err) {
    console.error("[admin/recipes/versions POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
