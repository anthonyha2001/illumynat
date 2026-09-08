import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/customer/ProductCard";
import { getProducts, getDistinctScentFamilies, type ProductSortKey } from "@/lib/data/products";
import { ShopFilters } from "./ShopFilters";
import { Spinner } from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Shop — ILLUMYNAT" };

interface Props {
  searchParams: Promise<{
    scent?: string;
    sort?: string;
    search?: string;
    min?: string;
    max?: string;
  }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = (params.sort ?? "newest") as ProductSortKey;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [products, scentFamilies, wishlistItems] = await Promise.all([
    getProducts({
      scentFamily: params.scent,
      sort,
      search: params.search,
      minPrice: params.min ? parseFloat(params.min) : undefined,
      maxPrice: params.max ? parseFloat(params.max) : undefined,
    }),
    getDistinctScentFamilies(),
    user
      ? prisma.wishlistItem.findMany({ where: { profileId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const wishlistedIds = new Set(wishlistItems.map((w) => w.productId));

  return (
    <div className="min-h-screen bg-bg">
      {/* Page header */}
      <div className="border-b border-border-subtle bg-bg">
        <Container className="py-10 md:py-14">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-3">
            Our Collection
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light italic text-text">
            All Candles
          </h1>
          {params.search && (
            <p className="mt-2 font-body text-sm text-text-muted">
              Showing results for &ldquo;{params.search}&rdquo;
            </p>
          )}
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-10 md:gap-14">
          {/* Sidebar filters */}
          <aside className="md:w-56 shrink-0">
            <Suspense fallback={<div className="space-y-2"><Spinner size="sm" /></div>}>
              <ShopFilters
                scentFamilies={scentFamilies}
                activeScent={params.scent}
                activeSort={sort}
                activeSearch={params.search}
              />
            </Suspense>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="font-body text-sm text-text-muted">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <span className="font-display text-5xl italic text-text-faint">I</span>
                <p className="font-display text-2xl font-light text-text">No products found</p>
                <p className="font-body text-sm text-text-muted">
                  Try adjusting your filters or{" "}
                  <a href="/shop" className="text-accent underline underline-offset-2">clear all</a>.
                </p>
              </div>
            ) : (
              <Suspense>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 3} initialWishlisted={wishlistedIds.has(product.id)} />
                  ))}
                </div>
              </Suspense>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
