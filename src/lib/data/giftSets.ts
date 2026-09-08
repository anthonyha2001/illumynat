import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function getActiveGiftSets() {
  const sets = await prisma.giftSet.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subtitle: true,
      description: true,
      price: true,
      imageUrl: true,
      tag: true,
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
    },
  });

  return sets.map((s) => ({ ...s, price: toNum(s.price) }));
}

export type GiftSetWithItems = Awaited<ReturnType<typeof getActiveGiftSets>>[number];
