import { HeroSection } from "@/components/customer/HeroSection";
import { RitualSection } from "@/components/customer/RitualSection";
import { ScentFamilySection } from "@/components/customer/ScentFamilySection";
import { CollectionSection } from "@/components/customer/CollectionSection";
import { GiftingBanner } from "@/components/customer/GiftingBanner";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { getFeaturedProducts, getBestSellers, getNewArrivals } from "@/lib/data/products";
import { getHeroContent } from "@/lib/data/siteContent";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "ILLUMYNAT — Luxury Artisan Candles",
  description:
    "Hand-poured in small batches using the finest raw materials. Discover candles crafted to become part of your daily ritual.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all collections in parallel — server components, zero client JS
  const [featured, bestSellers, newArrivals, wishlistItems, hero] = await Promise.all([
    getFeaturedProducts(4),
    getBestSellers(4),
    getNewArrivals(4),
    user
      ? prisma.wishlistItem.findMany({ where: { profileId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
    getHeroContent(),
  ]);

  const wishlistedIds = new Set(wishlistItems.map((w) => w.productId));

  return (
    <>
      {/* 1. Full-viewport hero with parallax */}
      <HeroSection content={hero} />

      {/* 2. Featured collection */}
      <AnimateIn>
        <CollectionSection
          eyebrow="The collection"
          title="Crafted for your space."
          products={featured}
          viewAllHref="/shop"
          wishlistedIds={wishlistedIds}
        />
      </AnimateIn>

      {/* 3. Brand story */}
      <AnimateIn delay={50}>
        <RitualSection />
      </AnimateIn>

      {/* 4. Best sellers */}
      {bestSellers.length > 0 && (
        <AnimateIn delay={50}>
          <CollectionSection
            eyebrow="Most loved"
            title="The ones they keep coming back for."
            products={bestSellers}
            viewAllHref="/shop?filter=bestsellers"
            badge="bestseller"
            wishlistedIds={wishlistedIds}
          />
        </AnimateIn>
      )}

      {/* 5. Gifting editorial banner */}
      <AnimateIn animation="fade-in">
        <GiftingBanner />
      </AnimateIn>

      {/* 6. Scent family explorer */}
      <AnimateIn delay={50}>
        <ScentFamilySection />
      </AnimateIn>

      {/* 7. New arrivals */}
      {newArrivals.length > 0 && (
        <AnimateIn delay={50}>
          <CollectionSection
            eyebrow="Just in"
            title="New arrivals."
            products={newArrivals}
            viewAllHref="/shop?filter=new"
            badge="new"
            wishlistedIds={wishlistedIds}
          />
        </AnimateIn>
      )}
    </>
  );
}
