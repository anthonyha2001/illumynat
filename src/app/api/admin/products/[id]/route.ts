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
    const body = await req.json();
    const {
      name, slug, sku, description, story, price, taxable, status,
      categoryId, scentFamily, burnTime, netWeight, waxType,
      fragranceNotes, dimensions, imageUrls, tags,
    } = body;

    // Update product fields
    const product = await prisma.product.update({
      where: { id },
      data: {
        name, slug, sku, description,
        story:          story          || null,
        price:          price !== undefined ? parseFloat(price) : undefined,
        taxable,
        status,
        categoryId,
        scentFamily:    scentFamily    || null,
        burnTime:       burnTime       || null,
        netWeight:      netWeight      || null,
        waxType:        waxType        || null,
        fragranceNotes: fragranceNotes || null,
        dimensions:     dimensions     || null,
        tags:           Array.isArray(tags) ? tags : undefined,
      },
      select: { id: true, slug: true },
    });

    // Replace images if provided
    if (Array.isArray(imageUrls)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (imageUrls.length > 0) {
        await prisma.productImage.createMany({
          data: imageUrls.map((url: string, i: number) => ({
            productId: id,
            url,
            isPrimary: i === 0,
            position:  i,
          })),
        });
      }
    }

    return NextResponse.json({ product });
  } catch (err: unknown) {
    console.error("[admin/products PATCH]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Archive (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/products DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
