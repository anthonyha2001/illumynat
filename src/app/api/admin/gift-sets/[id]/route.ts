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
    const { name, slug, subtitle, description, price, imageUrl, tag, sortOrder, isActive, items } = await req.json();

    await prisma.$transaction(async (tx) => {
      await tx.giftSet.update({
        where: { id },
        data: {
          name, slug,
          subtitle:    subtitle    ?? null,
          description: description ?? null,
          price,
          imageUrl:    imageUrl    ?? null,
          tag:         tag         ?? null,
          sortOrder:   sortOrder   ?? 0,
          isActive:    isActive    ?? true,
        },
      });

      // Replace items
      await tx.giftSetItem.deleteMany({ where: { giftSetId: id } });
      if (Array.isArray(items) && items.length > 0) {
        await tx.giftSetItem.createMany({
          data: items.map((item: { productId: string; quantity: number }, i: number) => ({
            giftSetId: id,
            productId: item.productId,
            quantity:  item.quantity ?? 1,
            sortOrder: i,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[admin/gift-sets PATCH]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.giftSet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/gift-sets DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
