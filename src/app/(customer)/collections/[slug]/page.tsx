import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/customer/ProductCard";
import { FadeInStagger, FadeInItem } from "@/components/ui/FadeIn";
import { getActiveCategories, getProducts } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const categories = await getActiveCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Not Found — LUMYNAT" };
  return { title: `${cat.name} Collection — LUMYNAT` };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [categories, products, wishlistItems] = await Promise.all([
    getActiveCategories(),
    getProducts({ category: slug }),
    user
      ? prisma.wishlistItem.findMany({ where: { profileId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const wishlistedIds = new Set(wishlistItems.map((w) => w.productId));

  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div className="relative overflow-hidden bg-bg-dark">
        <div className="relative h-64 md:h-80">
          {cat.imageUrl && (
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              fill
              sizes="100vw"
              className="object-cover opacity-50"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-3">
            Collection
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-light italic text-text-inverse mb-3">
            {cat.name}
          </h1>
          {cat.description && (
            <p className="font-body text-sm text-text-inverse/60 max-w-md leading-relaxed">
              {cat.description}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-border-subtle">
        <Container className="py-4">
          <p className="font-body text-[11px] text-text-muted">
            <Link href="/collections" className="hover:text-accent transition-colors duration-200">
              Collections
            </Link>
            {" / "}
            <span className="text-text">{cat.name}</span>
          </p>
        </Container>
      </div>

      {/* Products */}
      <Container className="py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <p className="font-body text-sm text-text-muted">
            {products.length} {products.length === 1 ? "candle" : "candles"}
          </p>
          <Link
            href="/shop"
            className="font-body text-[11px] tracking-[0.15em] uppercase text-text-muted hover:text-accent transition-colors duration-200"
          >
            View All →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="font-display text-2xl font-light text-text">No candles yet</p>
            <p className="font-body text-sm text-text-muted">
              Check back soon — this collection is being curated.
            </p>
            <Link
              href="/shop"
              className="font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-6 py-3 hover:bg-accent hover:text-text-on-gold transition-colors duration-200 mt-2"
            >
              Browse All
            </Link>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product, i) => (
              <FadeInItem key={product.id}>
                <ProductCard product={product} priority={i < 4} initialWishlisted={wishlistedIds.has(product.id)} />
              </FadeInItem>
            ))}
          </FadeInStagger>
        )}
      </Container>

      {/* Other collections */}
      {categories.filter((c) => c.slug !== slug).length > 0 && (
        <div className="border-t border-border-subtle bg-bg-subtle">
          <Container className="py-12 md:py-16">
            <p className="font-body text-[11px] font-medium tracking-[0.2em] uppercase text-text-muted mb-8 text-center">
              More Collections
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {categories
                .filter((c) => c.slug !== slug)
                .map((other) => (
                  <Link
                    key={other.id}
                    href={`/collections/${other.slug}`}
                    className="font-body text-sm text-text-subtle border border-border px-6 py-3 hover:border-accent hover:text-accent transition-colors duration-200"
                  >
                    {other.name}
                  </Link>
                ))}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
