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

    const body = await req.json();
    const {
      name, slug, sku, description, story, price, taxable, status,
      categoryId, scentFamily, burnTime, netWeight, waxType,
      fragranceNotes, dimensions, imageUrls, tags,
    } = body;

    if (!name || !slug || !sku || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name, slug, sku, description,
        story:          story || null,
        price:          parseFloat(price),
        taxable:        taxable ?? true,
        status:         status ?? "DRAFT",
        categoryId,
        scentFamily:    scentFamily || null,
        burnTime:       burnTime    || null,
        netWeight:      netWeight   || null,
        waxType:        waxType     || null,
        fragranceNotes: fragranceNotes || null,
        dimensions:     dimensions  || null,
        tags:           Array.isArray(tags) ? tags : [],
        images: imageUrls?.length ? {
          create: (imageUrls as string[]).map((url: string, i: number) => ({
            url,
            isPrimary: i === 0,
            position:  i,
          })),
        } : undefined,
        // Create empty finished goods record
        finishedGoods: { create: { quantityOnHand: 0 } },
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    console.error("[admin/products POST]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
