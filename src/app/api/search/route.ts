import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name:        { contains: q, mode: "insensitive" } },
        { sku:         { contains: q, mode: "insensitive" } },
        { scentFamily: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      scentFamily: true,
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: { name: "asc" },
  });

  const results = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    scentFamily: p.scentFamily,
    category: p.category.name,
    imageUrl: p.images[0]?.url ?? null,
  }));

  return NextResponse.json({ results });
}
