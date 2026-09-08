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

    const { code, amount, issuedToEmail, expiresAt, notes } = await req.json();

    if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });

    // Resolve profile if email matches
    let issuedToProfileId: string | undefined;
    if (issuedToEmail) {
      const profile = await prisma.profile.findUnique({
        where: { email: issuedToEmail.trim().toLowerCase() },
        select: { id: true },
      });
      if (profile) issuedToProfileId = profile.id;
    }

    const giftCard = await prisma.$transaction(async (tx) => {
      const gc = await tx.giftCard.create({
        data: {
          code:             code.trim().toUpperCase(),
          initialBalance:   amount,
          currentBalance:   amount,
          issuedToProfileId: issuedToProfileId ?? null,
          issuedToEmail:    issuedToEmail?.trim() || null,
          expiresAt:        expiresAt ? new Date(expiresAt) : null,
          isActive:         true,
        },
        select: { id: true, code: true },
      });

      // Record the ISSUED transaction
      await tx.giftCardTransaction.create({
        data: {
          giftCardId:   gc.id,
          type:         "ISSUED",
          amount:       amount,
          balanceAfter: amount,
          notes:        notes ?? "Issued by admin",
        },
      });

      return gc;
    });

    return NextResponse.json({ giftCard }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "A gift card with that code already exists" }, { status: 409 });
    }
    console.error("[gift-cards POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
