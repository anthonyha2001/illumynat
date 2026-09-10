import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { WishlistGrid } from "./WishlistGrid";

export const metadata = { title: "Wishlist — LUMYNAT" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productId: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          scentFamily: true,
          burnTime: true,
          netWeight: true,
          status: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, altText: true },
          },
          finishedGoods: { select: { quantityOnHand: true } },
        },
      },
    },
  });

  // Serialize Decimal price
  const serialized = items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: typeof item.product.price === "number"
        ? item.product.price
        : parseFloat(String(item.product.price)) || 0,
    },
  }));

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href="/account"
              className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-3 block"
            >
              ← Account
            </Link>
            <h1 className="font-display text-4xl font-light italic text-text">
              Wishlist
            </h1>
            {serialized.length > 0 && (
              <p className="font-body text-sm text-text-muted mt-1">
                {serialized.length} {serialized.length === 1 ? "item" : "items"} saved
              </p>
            )}
          </div>
        </div>

        {serialized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center">
              <svg className="w-7 h-7 text-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.3 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="font-display text-2xl font-light text-text">Nothing saved yet</p>
              <p className="font-body text-sm text-text-muted leading-relaxed">
                Tap the heart on any candle to save it here.
              </p>
            </div>
            <Button href="/shop" variant="primary" size="md">Browse Collection</Button>
          </div>
        ) : (
          <WishlistGrid items={serialized} />
        )}
      </Container>
    </div>
  );
}
