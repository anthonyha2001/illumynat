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

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, amount, notes } = await req.json();

    const gc = await prisma.giftCard.findUnique({
      where: { id },
      select: { id: true, isActive: true, currentBalance: true },
    });
    if (!gc) return NextResponse.json({ error: "Gift card not found" }, { status: 404 });

    if (action === "activate") {
      await prisma.giftCard.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ ok: true });
    }

    if (action === "deactivate") {
      await prisma.giftCard.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ ok: true });
    }

    if (action === "adjust") {
      if (amount === undefined || amount === 0) {
        return NextResponse.json({ error: "Amount is required and must be non-zero" }, { status: 400 });
      }

      const current   = toNum(gc.currentBalance);
      const newBalance = Math.max(0, current + amount);

      await prisma.$transaction([
        prisma.giftCard.update({
          where: { id },
          data:  { currentBalance: newBalance },
        }),
        prisma.giftCardTransaction.create({
          data: {
            giftCardId:   id,
            type:         "ADJUSTED",
            amount:       Math.abs(amount),
            balanceAfter: newBalance,
            notes:        notes ?? "Manual admin adjustment",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, newBalance });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[gift-cards PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
