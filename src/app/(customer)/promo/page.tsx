import { prisma } from "@/lib/prisma";
import { getPromoZone } from "@/lib/data/siteContent";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/customer/ProductCard";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/FadeIn";
import { Countdown } from "./Countdown";
import { CopyButton } from "./CopyButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Special Offer — ILLUMYNAT", robots: "noindex" };

export default async function PromoPage() {
  const promo = await getPromoZone();

  // Fetch active products to showcase
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true, name: true, slug: true, sku: true,
      price: true, scentFamily: true, burnTime: true, status: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
      finishedGoods: { select: { quantityOnHand: true } },
    },
  });

  const isExpired = promo.expiresAt ? new Date(promo.expiresAt) < new Date() : false;
  const isLive = promo.isActive && !isExpired;

  if (!isLive) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent">ILLUMYNAT</p>
          <h1 className="font-display text-4xl font-light italic text-text">Nothing here right now.</h1>
          <p className="font-body text-sm text-text-muted">Check back soon for exclusive offers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Hero ── */}
      <section className="bg-bg-darker py-24 md:py-36 overflow-hidden relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 30%, #b8972a33 0%, transparent 70%)" }}
        />

        <Container className="relative z-10">
          <FadeIn className="max-w-2xl mx-auto text-center space-y-6">
            {promo.badgeText && (
              <span className="inline-block font-body text-[10px] tracking-[0.25em] uppercase border border-accent/40 text-accent px-3 py-1">
                {promo.badgeText}
              </span>
            )}

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light italic text-text-inverse leading-tight">
              {promo.pageTitle}
            </h1>

            {promo.pageSubtitle && (
              <p className="font-body text-base text-white/55 leading-relaxed max-w-md mx-auto">
                {promo.pageSubtitle}
              </p>
            )}

            {/* Countdown */}
            {promo.expiresAt && (
              <div className="flex justify-center pt-4">
                <Countdown expiresAt={promo.expiresAt} />
              </div>
            )}
          </FadeIn>
        </Container>
      </section>

      {/* ── Promo Code ── */}
      {(promo.promoCode || promo.promoDiscount) && (
        <section className="py-14 bg-bg border-b border-border-subtle">
          <Container>
            <FadeIn className="max-w-lg mx-auto text-center space-y-4">
              {promo.promoDiscount && (
                <p className="font-display text-2xl font-light text-accent">{promo.promoDiscount}</p>
              )}
              {promo.promoCode && (
                <div className="flex items-center justify-center gap-4">
                  <p className="font-body text-[11px] tracking-widest uppercase text-text-muted">Use code</p>
                  <div className="border-2 border-accent border-dashed px-6 py-3">
                    <p className="font-mono text-2xl font-medium tracking-[0.2em] text-text select-all">
                      {promo.promoCode}
                    </p>
                  </div>
                  <CopyButton code={promo.promoCode} />
                </div>
              )}
              {promo.pageBody && (
                <p className="font-body text-sm text-text-muted leading-relaxed mt-4">
                  {promo.pageBody}
                </p>
              )}
            </FadeIn>
          </Container>
        </section>
      )}

      {/* ── Products ── */}
      {products.length > 0 && (
        <section className="py-20 md:py-28">
          <Container>
            <FadeIn className="text-center mb-14 space-y-2">
              <p className="font-body text-[10px] tracking-[0.25em] uppercase text-accent">Featured</p>
              <h2 className="font-display text-3xl md:text-4xl font-light italic text-text">
                Shop the collection
              </h2>
            </FadeIn>

            <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product, i) => (
                <FadeInItem key={product.id}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <ProductCard product={product as any} priority={i < 2} />
                </FadeInItem>
              ))}
            </FadeInStagger>
          </Container>
        </section>
      )}

    </div>
  );
}

