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

    const {
      name, description, consumptionUnit, purchaseUnit,
      conversionFactor, reorderThreshold, isActive,
    } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        description:      description      ?? null,
        consumptionUnit,
        purchaseUnit,
        conversionFactor: conversionFactor ?? 1,
        reorderThreshold: reorderThreshold ?? 0,
        isActive:         isActive         ?? true,
      },
      select: { id: true },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (err: unknown) {
    console.error("[admin/materials POST]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A material with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
