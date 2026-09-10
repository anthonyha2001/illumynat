import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GiftSetForm } from "../GiftSetForm";

export const metadata = { title: "New Gift Set — LUMYNAT Admin" };

export default async function NewGiftSetPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/gift-sets"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Gift Sets
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Gift Set</h1>
      </div>
      <GiftSetForm products={products} />
    </div>
  );
}
