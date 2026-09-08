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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId } = await params;
    const { carrier, trackingNumber, estimatedDelivery, notes } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, status: true, orderNumber: true,
        shippingFirstName: true, shippingLastName: true,
        guestEmail: true,
        profile: { select: { firstName: true, lastName: true, email: true } },
        shipment: { select: { id: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isNewShipment = !order.shipment;

    // Upsert the Shipment record
    const shipment = await prisma.shipment.upsert({
      where:  { orderId },
      create: {
        orderId,
        carrier:           carrier           ?? null,
        trackingNumber:    trackingNumber    ?? null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes:             notes             ?? null,
        shippedAt:         new Date(),
      },
      update: {
        carrier:           carrier           ?? null,
        trackingNumber:    trackingNumber    ?? null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes:             notes             ?? null,
      },
      select: { id: true, carrier: true, trackingNumber: true, estimatedDelivery: true },
    });

    // Send shipped email if order is SHIPPED and this is the first time tracking is saved
    if (order.status === "SHIPPED" && isNewShipment && trackingNumber) {
      const email     = order.profile?.email ?? order.guestEmail;
      const firstName = order.profile?.firstName ?? order.shippingFirstName;
      const lastName  = order.profile?.lastName  ?? order.shippingLastName;
      const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://illumynat.com";

      if (email) {
        try {
          await resend.emails.send({
            from:    FROM_EMAIL,
            to:      email,
            subject: `Tracking Info for ${order.orderNumber}`,
            html: orderShippedHtml({
              orderNumber:       order.orderNumber,
              customerName:      `${firstName} ${lastName}`,
              carrier:           shipment.carrier ?? undefined,
              trackingNumber:    shipment.trackingNumber ?? undefined,
              estimatedDelivery: shipment.estimatedDelivery ?? undefined,
              orderUrl:          `${siteUrl}/account/orders/${order.id}`,
            }),
            text: orderShippedText({
              orderNumber:       order.orderNumber,
              customerName:      `${firstName} ${lastName}`,
              carrier:           shipment.carrier ?? undefined,
              trackingNumber:    shipment.trackingNumber ?? undefined,
              estimatedDelivery: shipment.estimatedDelivery ?? undefined,
              orderUrl:          `${siteUrl}/account/orders/${order.id}`,
            }),
          });
        } catch (emailErr) {
          console.error("[shipment POST] Failed to send tracking email:", emailErr);
        }
      }
    }

    return NextResponse.json({ shipment });
  } catch (err) {
    console.error("[shipment POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
