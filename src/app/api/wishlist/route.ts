import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/wishlist — toggle (add or remove)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    const existing = await prisma.wishlistItem.findUnique({
      where: { profileId_productId: { profileId: user.id, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    } else {
      await prisma.wishlistItem.create({ data: { profileId: user.id, productId } });
      return NextResponse.json({ wishlisted: true });
    }
  } catch (err) {
    console.error("[wishlist]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/wishlist — fetch current user's wishlist product IDs
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ids: [] });

    const items = await prisma.wishlistItem.findMany({
      where: { profileId: user.id },
      select: { productId: true },
    });

    return NextResponse.json({ ids: items.map((i) => i.productId) });
  } catch (err) {
    console.error("[wishlist GET]", err);
    return NextResponse.json({ ids: [] });
  }
}
