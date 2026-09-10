import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountCents, recipientEmail, recipientName, senderName, message } = body;

    if (!amountCents || amountCents < 2500) {
      return NextResponse.json({ error: "Minimum gift card amount is $25" }, { status: 400 });
    }
    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profileId: string | null = null;
    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { id: true } });
      profileId = profile?.id ?? null;
    }

    // Create Stripe PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: "usd",
      metadata: {
        type:          "gift_card",
        recipientEmail,
        recipientName: recipientName ?? "",
        senderName:    senderName ?? "",
        message:       message ?? "",
        profileId:     profileId ?? "",
      },
      receipt_email: user?.email ?? recipientEmail,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[gift-card/purchase]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
