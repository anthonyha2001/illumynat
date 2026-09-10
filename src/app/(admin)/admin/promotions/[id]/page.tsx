import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PromoForm } from "../PromoForm";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const p = await prisma.promoCode.findUnique({ where: { id }, select: { code: true } });
  return { title: `${p?.code ?? "Promo"} — LUMYNAT Admin` };
}

export default async function EditPromoPage({ params }: Props) {
  const { id } = await params;

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    select: {
      id: true, code: true, type: true, value: true,
      minimumOrderAmount: true, maxRedemptions: true,
      redemptionCount: true, expiresAt: true, isActive: true,
    },
  });

  if (!promo) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/promotions"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Promotions
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text font-mono tracking-widest">
          {promo.code}
        </h1>
      </div>
      <PromoForm
        promoId={promo.id}
        redemptionCount={promo.redemptionCount}
        initial={{
          code:               promo.code,
          type:               promo.type,
          value:              String(Number(promo.value)),
          minimumOrderAmount: String(Number(promo.minimumOrderAmount)),
          maxRedemptions:     promo.maxRedemptions !== null ? String(promo.maxRedemptions) : "",
          expiresAt:          promo.expiresAt ? new Date(promo.expiresAt).toISOString().split("T")[0] : "",
          isActive:           promo.isActive,
        }}
      />
    </div>
  );
}
