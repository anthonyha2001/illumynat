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

    const { name, slug, description, imageUrl, isActive } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });

    const category = await prisma.category.create({
      data: { name, slug, description: description ?? null, imageUrl: imageUrl ?? null, isActive: isActive ?? true },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: unknown) {
    console.error("[admin/categories POST]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
