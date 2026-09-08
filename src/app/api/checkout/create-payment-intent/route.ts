import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import type { CartItem } from "@/stores/cartStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-08-26.dahlia",
});

interface RequestBody {
  cart: CartItem[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    notes: string;
  };
  totalCents: number;
  promoCode?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { cart, contact, totalCents, promoCode } = body;

    if (!cart?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // ── Validate prices from DB (never trust client) ──────
    const productIds = [...new Set(cart.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: {
        id: true,
        price: true,
        name: true,
        sku: true,
        finishedGoods: { select: { quantityOnHand: true } },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Recalculate totals server-side using DB settings
    const settings    = await getSettings();
    const TAX_RATE    = settings.TAX_RATE;
    let   subtotal    = 0;

    for (const item of cart) {
      const db = productMap.get(item.productId);
      if (!db) return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 });

      const dbPrice = typeof db.price === "number" ? db.price :
        "toNumber" in (db.price as object) ? (db.price as { toNumber: () => number }).toNumber() :
        parseFloat(String(db.price));

      subtotal += dbPrice * item.quantity;
    }

    // ── Validate promo code server-side ──────────────────
    let discountAmount = 0;
    let promoId: string | null = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase().trim() },
        select: {
          id: true, type: true, value: true, isActive: true,
          minimumOrderAmount: true, maxRedemptions: true,
          redemptionCount: true, expiresAt: true,
        },
      });

      const valid =
        promo &&
        promo.isActive &&
        (!promo.expiresAt || new Date(promo.expiresAt) >= new Date()) &&
        (promo.maxRedemptions === null || promo.redemptionCount < promo.maxRedemptions) &&
        subtotal >= Number(promo.minimumOrderAmount);

      if (valid && promo) {
        promoId = promo.id;
        const v = Number(promo.value);
        discountAmount = promo.type === "PERCENTAGE"
          ? parseFloat((subtotal * (v / 100)).toFixed(2))
          : Math.min(v, subtotal);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = discountedSubtotal >= settings.FREE_SHIPPING_THRESHOLD ? 0 : settings.SHIPPING_FEE;
    const taxAmount   = discountedSubtotal * TAX_RATE;
    const serverTotal = Math.round((discountedSubtotal + taxAmount + shippingFee) * 100);

    // Verify client total matches server calculation (within 1 cent tolerance)
    if (Math.abs(serverTotal - totalCents) > 1) {
      return NextResponse.json({ error: "Price mismatch. Please refresh and try again." }, { status: 400 });
    }

    // ── Get authenticated user (optional — guest checkout ok) ─
    const supabase  = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profileId: string | null = null;
    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { id: true } });
      profileId = profile?.id ?? null;
    }

    // ── Generate order number ──────────────────────────────
    const orderNumber = `ILM-${Date.now().toString(36).toUpperCase()}`;

    // ── Create PENDING order ───────────────────────────────
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status:        "PENDING",
        profileId,
        guestEmail:     profileId ? null : contact.email,
        guestFirstName: profileId ? null : contact.firstName,
        guestLastName:  profileId ? null : contact.lastName,
        guestPhone:     profileId ? null : contact.phone,
        shippingFirstName:    contact.firstName,
        shippingLastName:     contact.lastName,
        shippingAddressLine1: contact.address1,
        shippingAddressLine2: contact.address2 || null,
        shippingCity:    contact.city,
        shippingState:   contact.state,
        shippingZipCode: contact.zip,
        shippingCountry: contact.country || "LB",
        customerNotes:   contact.notes || null,
        subtotal,
        discountAmount,
        promoCodeId: promoId,
        taxAmount:   parseFloat(taxAmount.toFixed(2)),
        total:       parseFloat((discountedSubtotal + taxAmount + shippingFee).toFixed(2)),
        items: {
          create: cart.map((item) => {
            const db = productMap.get(item.productId)!;
            const dbPrice = typeof db.price === "number" ? db.price :
              "toNumber" in (db.price as object) ? (db.price as { toNumber: () => number }).toNumber() :
              parseFloat(String(db.price));
            return {
              productId: item.productId,
              sku:       db.sku,
              name:      db.name,
              price:     dbPrice,
              quantity:  item.quantity,
              subtotal:  dbPrice * item.quantity,
            };
          }),
        },
      },
    });

    // ── Create Stripe PaymentIntent ────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   serverTotal,
      currency: "usd",
      metadata: {
        orderId:     order.id,
        orderNumber: order.orderNumber,
      },
      receipt_email: contact.email,
      automatic_payment_methods: { enabled: true },
    });

    // ── Create pending Payment record ──────────────────────
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method:  "STRIPE",
        status:  "PENDING",
        amount:  parseFloat((discountedSubtotal + taxAmount + shippingFee).toFixed(2)),
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId:      order.id,
    });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
