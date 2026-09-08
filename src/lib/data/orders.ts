import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// ── Order list for account portal ─────────────────────────

export async function getOrdersByProfile(profileId: string) {
  const orders = await prisma.order.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        take: 1,
        select: {
          name: true,
          product: {
            select: {
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  return orders.map((o) => ({
    ...o,
    total: toNum(o.total),
  }));
}

// ── Single order detail ────────────────────────────────────

export async function getOrderById(id: string, profileId?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      createdAt: true,
      profileId: true,
      guestEmail: true,
      shippingFirstName: true,
      shippingLastName: true,
      shippingAddressLine1: true,
      shippingAddressLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingZipCode: true,
      shippingCountry: true,
      customerNotes: true,
      items: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          quantity: true,
          subtotal: true,
          product: {
            select: {
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
      payments: {
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          confirmedAt: true,
        },
      },
    },
  });

  if (!order) return null;
  // Authorization: only return if order belongs to profileId (or no profileId = guest/admin)
  if (profileId && order.profileId && order.profileId !== profileId) return null;

  return {
    ...order,
    subtotal:       toNum(order.subtotal),
    discountAmount: toNum(order.discountAmount),
    taxAmount:      toNum(order.taxAmount),
    total:          toNum(order.total),
    items: order.items.map((i) => ({
      ...i,
      price:    toNum(i.price),
      subtotal: toNum(i.subtotal),
    })),
    payments: order.payments.map((p) => ({
      ...p,
      amount: toNum(p.amount),
    })),
  };
}
