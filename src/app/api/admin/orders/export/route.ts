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

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to + "T23:59:59Z") } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      shippingFirstName: true,
      shippingLastName: true,
      shippingAddressLine1: true,
      shippingAddressLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingZipCode: true,
      shippingCountry: true,
      guestEmail: true,
      profile: { select: { email: true } },
      shipment: { select: { carrier: true, trackingNumber: true } },
      _count: { select: { items: true } },
    },
  });

  const HEADERS = [
    "Order Number", "Date", "Status",
    "Customer Name", "Email",
    "Items",
    "Subtotal", "Discount", "Tax", "Total",
    "Ship To", "City", "State", "ZIP", "Country",
    "Carrier", "Tracking Number",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toISOString().split("T")[0],
    o.status,
    `${o.shippingFirstName} ${o.shippingLastName}`,
    o.profile?.email ?? o.guestEmail ?? "",
    o._count.items,
    toNum(o.subtotal).toFixed(2),
    toNum(o.discountAmount).toFixed(2),
    toNum(o.taxAmount).toFixed(2),
    toNum(o.total).toFixed(2),
    [o.shippingAddressLine1, o.shippingAddressLine2].filter(Boolean).join(", "),
    o.shippingCity,
    o.shippingState,
    o.shippingZipCode,
    o.shippingCountry,
    o.shipment?.carrier ?? "",
    o.shipment?.trackingNumber ?? "",
  ].map(csvEscape).join(","));

  const csv = [HEADERS.join(","), ...rows].join("\n");
  const filename = `orders-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
