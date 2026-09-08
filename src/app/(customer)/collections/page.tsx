import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getActiveCategories } from "@/lib/data/products";

export const metadata = { title: "Collections — ILLUMYNAT" };

export default async function CollectionsPage() {
  const categories = await getActiveCategories();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border-subtle">
        <Container className="py-12 md:py-20 text-center">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
            Curated for You
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-light italic text-text mb-4">
            Our Collections
          </h1>
          <p className="font-body text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            Each collection is built around a single emotional truth — a mood, a memory, a moment.
            Find the one that speaks to you.
          </p>
        </Container>
      </div>

      {/* Collection grid */}
      <Container className="py-14 md:py-20">
        {categories.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl font-light text-text-muted">
              Collections coming soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {categories.map((cat, i) => {
              const isWide = categories.length % 2 !== 0 && i === categories.length - 1;
              return (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.slug}`}
                  className={`group relative overflow-hidden bg-bg-subtle ${isWide ? "md:col-span-2" : ""}`}
                >
                  {/* Image */}
                  <div className={`relative w-full overflow-hidden ${isWide ? "aspect-[21/9]" : "aspect-[4/3]"}`}>
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes={isWide ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        priority={i < 2}
                      />
                    ) : (
                      <div className="w-full h-full bg-bg-muted flex items-center justify-center">
                        <span className="font-display text-6xl italic text-text-faint">I</span>
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-bg-dark/20 to-transparent" />
                  </div>

                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <p className="font-body text-[10px] tracking-[0.25em] uppercase text-accent mb-2">
                      {cat._count.products} {cat._count.products === 1 ? "candle" : "candles"}
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl font-light italic text-text-inverse mb-2 leading-tight">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="font-body text-sm text-white/60 leading-relaxed max-w-sm">
                        {cat.description}
                      </p>
                    )}
                    <span className="inline-block mt-4 font-body text-[11px] tracking-[0.2em] uppercase text-white/50 group-hover:text-accent transition-colors duration-300">
                      Explore →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>

      {/* Bottom CTA */}
      <div className="border-t border-border-subtle bg-bg-subtle">
        <Container className="py-14 text-center">
          <p className="font-display text-2xl md:text-3xl font-light italic text-text mb-4">
            Can&apos;t decide? Browse everything.
          </p>
          <Link
            href="/shop"
            className="inline-block font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-8 py-4 hover:bg-accent hover:text-text-on-gold transition-colors duration-300"
          >
            Shop All Candles
          </Link>
        </Container>
      </div>
    </div>
  );
}
