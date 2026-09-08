import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GiftSetForm } from "../GiftSetForm";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const s = await prisma.giftSet.findUnique({ where: { id }, select: { name: true } });
  return { title: `${s?.name ?? "Gift Set"} — ILLUMYNAT Admin` };
}

export default async function EditGiftSetPage({ params }: Props) {
  const { id } = await params;

  const [giftSet, products] = await Promise.all([
    prisma.giftSet.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, subtitle: true,
        description: true, price: true, imageUrl: true,
        tag: true, sortOrder: true, isActive: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: { productId: true, quantity: true },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  if (!giftSet) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/gift-sets"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Gift Sets
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">{giftSet.name}</h1>
      </div>
      <GiftSetForm
        giftSetId={giftSet.id}
        products={products}
        initial={{
          name:        giftSet.name,
          slug:        giftSet.slug,
          subtitle:    giftSet.subtitle    ?? "",
          description: giftSet.description ?? "",
          price:       String(Number(giftSet.price)),
          imageUrl:    giftSet.imageUrl    ?? "",
          tag:         giftSet.tag         ?? "",
          sortOrder:   String(giftSet.sortOrder),
          isActive:    giftSet.isActive,
          items:       giftSet.items,
        }}
      />
    </div>
  );
}
