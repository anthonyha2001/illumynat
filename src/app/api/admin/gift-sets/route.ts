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

    const { name, slug, subtitle, description, price, imageUrl, tag, sortOrder, isActive, items } = await req.json();

    if (!name || !slug || !price) {
      return NextResponse.json({ error: "Name, slug, and price are required" }, { status: 400 });
    }

    const giftSet = await prisma.giftSet.create({
      data: {
        name, slug,
        subtitle:    subtitle    ?? null,
        description: description ?? null,
        price,
        imageUrl:    imageUrl    ?? null,
        tag:         tag         ?? null,
        sortOrder:   sortOrder   ?? 0,
        isActive:    isActive    ?? true,
        items: {
          create: (items ?? []).map((item: { productId: string; quantity: number }, i: number) => ({
            productId: item.productId,
            quantity:  item.quantity ?? 1,
            sortOrder: i,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ giftSet }, { status: 201 });
  } catch (err: unknown) {
    console.error("[admin/gift-sets POST]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
