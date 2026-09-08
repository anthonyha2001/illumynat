import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

    const { productId } = await params;
    const { rating, title, body, orderId } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (!body?.trim()) {
      return NextResponse.json({ error: "Review body is required" }, { status: 400 });
    }

    // Verify the order belongs to this user and contains this product
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        orderId,
        order: {
          profileId: user.id,
          status: { in: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED"] },
        },
      },
      select: { id: true },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 }
      );
    }

    // Check no existing review
    const existing = await prisma.productReview.findUnique({
      where: { profileId_productId: { profileId: user.id, productId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
    }

    const review = await prisma.productReview.create({
      data: {
        productId,
        profileId: user.id,
        orderId,
        rating,
        title:  title  ?? null,
        body:   body.trim(),
        status: "PENDING",
      },
      select: { id: true },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
