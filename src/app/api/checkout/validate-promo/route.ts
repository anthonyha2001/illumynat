import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
      select: {
        id: true, code: true, type: true, value: true,
        minimumOrderAmount: true, maxRedemptions: true,
        redemptionCount: true, expiresAt: true, isActive: true,
      },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "Invalid or inactive promo code" }, { status: 400 });
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }
    if (promo.maxRedemptions !== null && promo.redemptionCount >= promo.maxRedemptions) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
    }

    const minOrder = Number(promo.minimumOrderAmount);
    if (subtotal < minOrder) {
      return NextResponse.json({
        error: `Minimum order of $${minOrder.toFixed(2)} required for this code`,
      }, { status: 400 });
    }

    const value    = Number(promo.value);
    const discount = promo.type === "PERCENTAGE"
      ? parseFloat((subtotal * (value / 100)).toFixed(2))
      : Math.min(value, subtotal);

    return NextResponse.json({
      promoId:  promo.id,
      code:     promo.code,
      type:     promo.type,
      value,
      discount,
    });
  } catch (err) {
    console.error("[validate-promo]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
