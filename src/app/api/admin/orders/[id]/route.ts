import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { orderShippedHtml, orderShippedText } from "@/lib/emails/orderShipped";

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
    const { status, adminNotes } = await req.json();

    const prevOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status     !== undefined ? { status }     : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      select: {
        id: true, status: true, orderNumber: true,
        shippingFirstName: true, shippingLastName: true,
        guestEmail: true,
        profile: { select: { firstName: true, lastName: true, email: true } },
        shipment: { select: { carrier: true, trackingNumber: true, estimatedDelivery: true } },
      },
    });

    // Send shipped email when status transitions to SHIPPED
    if (status === "SHIPPED" && prevOrder?.status !== "SHIPPED") {
      const email     = order.profile?.email ?? order.guestEmail;
      const firstName = order.profile?.firstName ?? order.shippingFirstName;
      const lastName  = order.profile?.lastName  ?? order.shippingLastName;
      const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://illumynat.com";

      if (email) {
        try {
          await resend.emails.send({
            from:    FROM_EMAIL,
            to:      email,
            subject: `Your Order Has Shipped — ${order.orderNumber}`,
            html: orderShippedHtml({
              orderNumber:       order.orderNumber,
              customerName:      `${firstName} ${lastName}`,
              carrier:           order.shipment?.carrier,
              trackingNumber:    order.shipment?.trackingNumber,
              estimatedDelivery: order.shipment?.estimatedDelivery,
              orderUrl:          `${siteUrl}/account/orders/${order.id}`,
            }),
            text: orderShippedText({
              orderNumber:       order.orderNumber,
              customerName:      `${firstName} ${lastName}`,
              carrier:           order.shipment?.carrier,
              trackingNumber:    order.shipment?.trackingNumber,
              estimatedDelivery: order.shipment?.estimatedDelivery,
              orderUrl:          `${siteUrl}/account/orders/${order.id}`,
            }),
          });
        } catch (emailErr) {
          console.error("[admin/orders PATCH] Failed to send shipped email:", emailErr);
        }
      }
    }

    return NextResponse.json({ order: { id: order.id, status: order.status } });
  } catch (err) {
    console.error("[admin/orders PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Delete children first, then the order (cascade via Prisma)
    await prisma.$transaction([
      prisma.loyaltyTransaction.deleteMany({ where: { orderId: id } }),
      prisma.returnItem.deleteMany({ where: { return: { orderId: id } } }),
      prisma.return.deleteMany({ where: { orderId: id } }),
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.shipment.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/orders DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
