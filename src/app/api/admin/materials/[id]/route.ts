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
    const {
      name, description, consumptionUnit, purchaseUnit,
      conversionFactor, reorderThreshold, isActive,
    } = await req.json();

    const material = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name, description, consumptionUnit, purchaseUnit,
        conversionFactor, reorderThreshold, isActive,
      },
      select: { id: true },
    });

    return NextResponse.json({ material });
  } catch (err: unknown) {
    console.error("[admin/materials PATCH]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A material with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Soft-delete: mark inactive
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.rawMaterial.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/materials DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
