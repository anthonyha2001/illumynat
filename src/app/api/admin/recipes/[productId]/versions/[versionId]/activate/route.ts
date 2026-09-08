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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ productId: string; versionId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { versionId } = await params;

    const version = await prisma.recipeVersion.findUnique({
      where: { id: versionId },
      select: { recipeId: true },
    });
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    await prisma.$transaction([
      // Archive all other versions in this recipe
      prisma.recipeVersion.updateMany({
        where: { recipeId: version.recipeId, id: { not: versionId } },
        data: { status: "ARCHIVED" },
      }),
      // Activate this one
      prisma.recipeVersion.update({
        where: { id: versionId },
        data: { status: "ACTIVE", activatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/recipes/activate POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
