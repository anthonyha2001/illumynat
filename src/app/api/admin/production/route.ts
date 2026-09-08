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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, recipeVersionId, targetQuantity, notes } = await req.json();

    if (!productId || !recipeVersionId || !targetQuantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the recipe version is still ACTIVE
    const version = await prisma.recipeVersion.findUnique({
      where: { id: recipeVersionId },
      select: { status: true },
    });
    if (!version || version.status !== "ACTIVE") {
      return NextResponse.json({ error: "Recipe version is not active" }, { status: 400 });
    }

    const batch = await prisma.productionBatch.create({
      data: { productId, recipeVersionId, targetQuantity, notes: notes ?? null },
      select: { id: true },
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (err) {
    console.error("[admin/production POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
