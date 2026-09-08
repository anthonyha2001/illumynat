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
    const { code, type, value, minimumOrderAmount, maxRedemptions, expiresAt, isActive } = await req.json();

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        type,
        value,
        minimumOrderAmount: minimumOrderAmount ?? 0,
        maxRedemptions:     maxRedemptions     ?? null,
        expiresAt:          expiresAt          ? new Date(expiresAt) : null,
        isActive:           isActive           ?? true,
      },
      select: { id: true },
    });

    return NextResponse.json({ promo });
  } catch (err: unknown) {
    console.error("[admin/promotions PATCH]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "That promo code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/promotions DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
