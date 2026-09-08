import { Container } from "@/components/ui/Container";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/Button";
import type { ProductListItem } from "@/lib/data/products";

// ── CollectionSection ──────────────────────────────────────
// Receives server-fetched products from the homepage Server Component.
// Renders them in a responsive 4-column grid with stagger animation.

interface CollectionSectionProps {
  title: string;
  eyebrow?: string;
  products: ProductListItem[];
  viewAllHref?: string;
  badge?: "new" | "bestseller" | "limited";
  wishlistedIds?: Set<string>;
}

export function CollectionSection({
  title,
  eyebrow,
  products,
  viewAllHref = "/shop",
  badge,
  wishlistedIds,
}: CollectionSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-bg">
      <Container>

        {/* Header */}
        <FadeIn className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
          <div className="space-y-2">
            {eyebrow && (
              <span className="font-body text-[10px] tracking-[0.25em] uppercase text-accent">
                {eyebrow}
              </span>
            )}
            <h2 className="font-display text-3xl md:text-4xl font-light italic text-text leading-tight">
              {title}
            </h2>
          </div>
          <Button href={viewAllHref} variant="secondary" size="sm">View All</Button>
        </FadeIn>

        {/* Product grid */}
        <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product, i) => (
            <FadeInItem key={product.id}>
              <ProductCard
                product={product}
                badge={badge}
                priority={i < 2}
                initialWishlisted={wishlistedIds?.has(product.id) ?? false}
              />
            </FadeInItem>
          ))}
        </FadeInStagger>

      </Container>
    </section>
  );
}
