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

// Create a new standalone recipe
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, productId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Recipe name is required" }, { status: 400 });

    const recipe = await prisma.recipe.create({
      data: {
        name: name.trim(),
        productId: productId ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, recipeId: recipe.id }, { status: 201 });
  } catch (err) {
    console.error("[admin/recipes POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
