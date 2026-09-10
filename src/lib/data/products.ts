import { prisma } from "@/lib/prisma";
import { ProductStatus, Prisma } from "@prisma/client";

// ── Decimal → number serializer ────────────────────────────
// Prisma Decimal objects can't cross the Server→Client boundary.
// Convert all Decimal fields to plain numbers before returning.

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function serializeProduct<T extends { price: unknown }>(p: T) {
  return { ...p, price: toNum(p.price) };
}

// ── Shared select shape ────────────────────────────────────

const productSelect = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  scentFamily: true,
  burnTime: true,
  netWeight: true,
  status: true,
  tags: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, altText: true },
  },
  finishedGoods: {
    select: { quantityOnHand: true },
  },
} as const;

export type ProductListItem = Awaited<ReturnType<typeof getFeaturedProducts>>[number];

// ── Featured products — for homepage hero collection ───────

export async function getFeaturedProducts(limit = 4) {
  const rows = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: productSelect,
  });
  return rows.map(serializeProduct);
}

// ── Best sellers — ordered by total units sold ─────────────

export async function getBestSellers(limit = 4) {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (topProducts.length === 0) {
    return getFeaturedProducts(limit);
  }

  const ids = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: ProductStatus.ACTIVE },
    select: productSelect,
  });

  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => p !== undefined)
    .map(serializeProduct);
}

// ── New arrivals — last 30 days ────────────────────────────

export async function getNewArrivals(limit = 4) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: productSelect,
  });
  return rows.map(serializeProduct);
}

// ── All products with optional filters ────────────────────

export type ProductSortKey = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ProductFilters {
  scentFamily?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortKey;
  search?: string;
  category?: string;
}

export async function getProducts(filters: ProductFilters = {}) {
  const { scentFamily, minPrice, maxPrice, sort = "newest", search, category } = filters;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(scentFamily && { scentFamily }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(category && { category: { slug: category } }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"  ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    sort === "name_asc"   ? { name: "asc" } :
                            { createdAt: "desc" };

  const rows = await prisma.product.findMany({ where, orderBy, select: productSelect });
  return rows.map(serializeProduct);
}

export type ProductItem = Awaited<ReturnType<typeof getProducts>>[number];

// ── Distinct scent families ────────────────────────────────

export async function getDistinctScentFamilies(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE, scentFamily: { not: null } },
    select: { scentFamily: true },
    distinct: ["scentFamily"],
    orderBy: { scentFamily: "asc" },
  });
  return rows.map((r) => r.scentFamily).filter(Boolean) as string[];
}

// ── Active categories ──────────────────────────────────────

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { products: { where: { status: ProductStatus.ACTIVE } } } },
    },
  });
}

// ── Single product by slug ─────────────────────────────────

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      ...productSelect,
      story: true,
      waxType: true,
      fragranceNotes: true,
      dimensions: true,
      taxable: true,
      category: { select: { name: true, slug: true } },
      images: {
        orderBy: { position: "asc" },
        select: { url: true, altText: true, isPrimary: true, position: true },
      },
      customizations: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          isRequired: true,
          priceModifier: true,
          maxLength: true,
          placeholder: true,
          options: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true, priceModifier: true },
          },
        },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!product) return null;

  // Serialize all Decimal fields before crossing the server/client boundary
  return {
    ...product,
    price: toNum(product.price),
    customizations: product.customizations.map((c) => ({
      ...c,
      priceModifier: toNum(c.priceModifier),
      options: c.options.map((o) => ({
        ...o,
        priceModifier: toNum(o.priceModifier),
      })),
    })),
  };
}
