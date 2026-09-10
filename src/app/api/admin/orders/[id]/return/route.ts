import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return 0;
}

interface Props { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orderId } = await params;
  const body: {
    reason: string;
    notes?: string;
    items: { orderItemId: string; quantity: number; reason?: string }[];
    refundAmount: number;
    processRefund: boolean;
  } = await req.json();

  // Fetch order + payment intent
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true, status: true,
      payments: { select: { stripePaymentIntentId: true, status: true }, where: { status: "COMPLETED" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let stripeRefundId: string | undefined;

  // Issue Stripe refund if requested
  if (body.processRefund && body.refundAmount > 0) {
    const pi = order.payments[0]?.stripePaymentIntentId;
    if (!pi) return NextResponse.json({ error: "No completed payment found to refund" }, { status: 400 });

    const stripe = getStripe();
    // Retrieve PaymentIntent to get charge id
    const paymentIntent = await stripe.paymentIntents.retrieve(pi);
    const chargeId = typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

    if (!chargeId) return NextResponse.json({ error: "Could not find charge for refund" }, { status: 400 });

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: Math.round(body.refundAmount * 100),
    });
    stripeRefundId = refund.id;
  }

  // Create Return record + update order status
  const ret = await prisma.$transaction(async (tx) => {
    const ret = await tx.return.create({
      data: {
        orderId,
        reason:        body.reason,
        notes:         body.notes || null,
        status:        body.processRefund ? "REFUNDED" : "APPROVED",
        refundAmount:  body.refundAmount,
        stripeRefundId: stripeRefundId ?? null,
        items: {
          create: body.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity:    i.quantity,
            reason:      i.reason || null,
          })),
        },
      },
    });

    if (body.processRefund) {
      await tx.order.update({
        where: { id: orderId },
        data:  { status: "REFUNDED" },
      });
    }

    return ret;
  });

  return NextResponse.json({ returnId: ret.id });
}
