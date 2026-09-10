import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { orderConfirmationHtml, orderConfirmationText } from "@/lib/emails/orderConfirmation";
import { giftCardIssuedHtml, giftCardIssuedText } from "@/lib/emails/giftCardIssued";
import { awardPurchasePoints } from "@/lib/data/loyalty";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const stripe    = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(pi);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  // ── Gift card purchase ─────────────────────────────────
  if (pi.metadata?.type === "gift_card") {
    await handleGiftCardIssued(pi);
    return;
  }

  // ── Regular order ──────────────────────────────────────
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;

  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data:  { status: "PAID" },
      select: {
        id: true, orderNumber: true,
        subtotal: true, discountAmount: true, taxAmount: true, total: true,
        shippingFirstName: true, shippingLastName: true,
        shippingAddressLine1: true, shippingAddressLine2: true,
        shippingCity: true, shippingState: true, shippingZipCode: true, shippingCountry: true,
        guestEmail: true,
        profile: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { name: true, sku: true, quantity: true, price: true, subtotal: true } },
      },
    }),
    prisma.payment.updateMany({
      where: { stripePaymentIntentId: pi.id },
      data:  { status: "COMPLETED", confirmedAt: new Date() },
    }),
  ]);

  // Send order confirmation email
  const email    = order.profile?.email ?? order.guestEmail;
  const firstName = order.profile?.firstName ?? order.shippingFirstName;
  const lastName  = order.profile?.lastName  ?? order.shippingLastName;
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumynat.com";

  if (email) {
    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: `Order Confirmed — ${order.orderNumber}`,
        html: orderConfirmationHtml({
          orderNumber:  order.orderNumber,
          customerName: `${firstName} ${lastName}`,
          items: order.items.map((i) => ({
            name:     i.name,
            sku:      i.sku,
            quantity: i.quantity,
            price:    Number(i.price),
            subtotal: Number(i.subtotal),
          })),
          subtotal:       Number(order.subtotal),
          discountAmount: Number(order.discountAmount),
          taxAmount:      Number(order.taxAmount),
          total:          Number(order.total),
          shippingAddress: {
            line1:   order.shippingAddressLine1,
            line2:   order.shippingAddressLine2,
            city:    order.shippingCity,
            state:   order.shippingState,
            zip:     order.shippingZipCode,
            country: order.shippingCountry,
          },
          orderUrl: `${siteUrl}/account/orders/${order.id}`,
        }),
        text: orderConfirmationText({
          orderNumber:  order.orderNumber,
          customerName: `${firstName} ${lastName}`,
          items: order.items.map((i) => ({
            name:     i.name,
            sku:      i.sku,
            quantity: i.quantity,
            price:    Number(i.price),
            subtotal: Number(i.subtotal),
          })),
          subtotal:       Number(order.subtotal),
          discountAmount: Number(order.discountAmount),
          taxAmount:      Number(order.taxAmount),
          total:          Number(order.total),
          shippingAddress: {
            line1:   order.shippingAddressLine1,
            line2:   order.shippingAddressLine2,
            city:    order.shippingCity,
            state:   order.shippingState,
            zip:     order.shippingZipCode,
            country: order.shippingCountry,
          },
          orderUrl: `${siteUrl}/account/orders/${order.id}`,
        }),
      });
    } catch (emailErr) {
      console.error("[stripe-webhook] Failed to send confirmation email:", emailErr);
    }
  }

  // Fire admin notification for the new paid order
  prisma.adminNotification.create({
    data: {
      type: "NEW_ORDER",
      title: `New order — ${order.orderNumber}`,
      body: `${order.profile?.firstName ?? order.shippingFirstName} ${order.profile?.lastName ?? order.shippingLastName} placed an order for $${Number(order.total).toFixed(2)}.`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.total),
        email: order.profile?.email ?? order.guestEmail,
      },
    },
  }).catch(() => {});

  // Award loyalty points if this was a logged-in customer
  if (order.profile) {
    try {
      // We need the profileId — re-fetch since the select above didn't include it
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { profileId: true, total: true },
      });
      if (fullOrder?.profileId) {
        await awardPurchasePoints(fullOrder.profileId, Number(fullOrder.total), orderId);
      }
    } catch (loyaltyErr) {
      console.error("[stripe-webhook] Loyalty points error:", loyaltyErr);
    }
  }

  console.log(`[stripe-webhook] Order ${orderId} marked PAID`);
}

async function handleGiftCardIssued(pi: Stripe.PaymentIntent) {
  const { recipientEmail, recipientName, profileId } = pi.metadata ?? {};
  const amountDollars = pi.amount / 100;

  // Generate unique 16-char code: XXXX-XXXX-XXXX-XXXX
  const seg = () => Math.random().toString(36).toUpperCase().substring(2, 6).padEnd(4, "0");
  const code = `${seg()}-${seg()}-${seg()}-${seg()}`;

  await prisma.giftCard.create({
    data: {
      code,
      initialBalance: amountDollars,
      currentBalance: amountDollars,
      issuedToEmail:  recipientEmail ?? null,
      issuedToProfileId: profileId || null,
      isActive: true,
    },
  });

  // Send gift card email to recipient
  if (recipientEmail) {
    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      recipientEmail,
        subject: `Your $${amountDollars} LUMYNAT Gift Card`,
        html: giftCardIssuedHtml({
          recipientName: recipientName ?? undefined,
          code,
          amount: amountDollars,
        }),
        text: giftCardIssuedText({
          recipientName: recipientName ?? undefined,
          code,
          amount: amountDollars,
        }),
      });
    } catch (emailErr) {
      console.error("[stripe-webhook] Failed to send gift card email:", emailErr);
    }
  }

  console.log(`[stripe-webhook] Gift card ${code} issued to ${recipientEmail} — $${amountDollars}`);
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data:  { status: "FAILED" },
  });

  console.log(`[stripe-webhook] Payment failed for order ${orderId}`);
}
