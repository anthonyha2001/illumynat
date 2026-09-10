import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { ProductCard } from "@/components/customer/ProductCard";
import { getFeaturedProducts } from "@/lib/data/products";
import { getActiveGiftSets } from "@/lib/data/giftSets";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Gifting — ILLUMYNAT",
  description: "Candles as gifts. Thoughtfully chosen, beautifully presented.",
};

const REASONS = [
  {
    title: "Complimentary Gift Wrapping",
    body:  "Every order ships in our signature matte black box with ivory tissue paper — no extra charge.",
  },
  {
    title: "Handwritten Note",
    body:  "Add a personal message at checkout. We write it by hand on a heavy card stock notecard.",
  },
  {
    title: "No Price Tags",
    body:  "Gift orders are packed without any pricing information. The recipient only sees the candle.",
  },
  {
    title: "Flexible Delivery",
    body:  "Ship directly to the recipient or to yourself. Schedule delivery up to 30 days in advance.",
  },
];

export default async function GiftingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [products, giftSets, wishlistItems] = await Promise.all([
    getFeaturedProducts(4),
    getActiveGiftSets(),
    user
      ? prisma.wishlistItem.findMany({ where: { profileId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const wishlistedIds = new Set(wishlistItems.map((w) => w.productId));

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-bg-dark">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 30% 60%, #3d2e1e 0%, #1a1108 55%, #0a0804 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />
        <Container className="relative z-10 py-24 md:py-36">
          <div className="max-w-xl">
            <p className="font-body text-[11px] tracking-[0.3em] uppercase text-accent mb-5">
              For Someone Special
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-light italic text-text-inverse leading-[1.05] mb-6">
              The gift of<br />
              <span className="not-italic text-accent">atmosphere.</span>
            </h1>
            <p className="font-body text-sm text-text-inverse/50 leading-relaxed max-w-sm mb-10">
              An ILLUMYNAT candle is not a placeholder gift. It is a considered one —
              something the recipient will light on purpose, in a room they want to feel different.
            </p>
            <Link
              href="/shop"
              className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
            >
              Shop All Candles
            </Link>
          </div>
        </Container>
      </div>

      {/* ── Gift sets ── */}
      {giftSets.length > 0 && (
        <AnimateIn>
        <Container className="py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
              Curated Sets
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light italic text-text mb-4">
              Ready to give.
            </h2>
            <p className="font-body text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              Every set is assembled by hand, packed in our signature box, and ships within 48 hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {giftSets.map((set) => (
              <div
                key={set.id}
                className="relative bg-surface border border-border-subtle flex flex-col"
              >
                {set.tag && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="font-body text-[10px] tracking-widest uppercase bg-accent text-text-on-gold px-3 py-1">
                      {set.tag}
                    </span>
                  </div>
                )}

                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-bg-dark">
                  {set.imageUrl ? (
                    <Image
                      src={set.imageUrl}
                      alt={set.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : set.items[0]?.product.images[0]?.url ? (
                    <Image
                      src={set.items[0].product.images[0].url}
                      alt={set.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-5xl font-light italic text-text-inverse/10">I</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/60 to-transparent" />
                </div>

                <div className="flex flex-col flex-1 p-6">
                  {set.subtitle && (
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-accent mb-1">
                      {set.subtitle}
                    </p>
                  )}
                  <h3 className="font-display text-2xl font-light text-text mb-3 leading-snug">
                    {set.name}
                  </h3>
                  {set.description && (
                    <p className="font-body text-sm text-text-muted leading-relaxed mb-4 flex-1">
                      {set.description}
                    </p>
                  )}

                  {/* Included products */}
                  <ul className="space-y-1 mb-5">
                    {set.items.map((item) => (
                      <li
                        key={item.product.id}
                        className="flex items-center gap-2 font-body text-[11px] text-text-subtle"
                      >
                        <span className="text-accent">—</span>
                        {item.quantity > 1 && `${item.quantity}× `}{item.product.name}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                    <span className="font-display text-2xl font-light text-text">
                      ${set.price.toFixed(2)}
                    </span>
                    <Link
                      href="/shop"
                      className="font-body text-[11px] tracking-[0.15em] uppercase text-accent border border-accent px-5 py-2.5 hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
                    >
                      Shop Set
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
        </AnimateIn>
      )}

      {/* ── Individual picks ── */}
      <AnimateIn>
      <div className="bg-bg-subtle border-y border-border-subtle">
        <Container className="py-20 md:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-3">
                Gift a Single Candle
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light italic text-text">
                Pick your favourite.
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:block font-body text-[11px] tracking-[0.15em] uppercase text-text-muted hover:text-accent transition-colors duration-200 pb-1"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 2} initialWishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        </Container>
      </div>
      </AnimateIn>

      {/* ── Why gift ILLUMYNAT ── */}
      <AnimateIn>
      <Container className="py-20 md:py-28">
        <div className="text-center mb-14">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
            The Details
          </p>
          <h2 className="font-display text-4xl font-light italic text-text">
            Every order, gift-ready.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {REASONS.map((r) => (
            <div key={r.title} className="flex flex-col gap-3">
              <span className="text-accent text-lg">✦</span>
              <h3 className="font-display text-xl font-light text-text leading-snug">{r.title}</h3>
              <p className="font-body text-sm text-text-muted leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </Container>
      </AnimateIn>

      {/* ── Gift card CTA ── */}
      <AnimateIn animation="fade-in">
      <div className="bg-bg-dark">
        <Container className="py-20 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">
                Not Sure Which Scent?
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light italic text-text-inverse mb-3">
                Send a gift card.
              </h2>
              <p className="font-body text-sm text-text-inverse/50 leading-relaxed max-w-sm">
                Let them choose. Available in any amount from $25. Delivered by email
                and redeemable on any order.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/gifting/gift-card"
                className="inline-block font-body text-[11px] tracking-[0.2em] uppercase border border-accent text-accent px-8 py-4 hover:bg-accent hover:text-text-on-gold transition-colors duration-200"
              >
                Purchase a Gift Card
              </Link>
            </div>
          </div>
        </Container>
      </div>
      </AnimateIn>

      {/* ── Corporate ── */}
      <Container className="py-16 text-center">
        <p className="font-body text-sm text-text-muted leading-relaxed max-w-md mx-auto">
          Looking for corporate gifting or bulk orders?{" "}
          <a
            href="mailto:admin@yourdomain.com"
            className="text-accent hover:underline underline-offset-2"
          >
            Contact us directly
          </a>{" "}
          and we&apos;ll put together something custom.
        </p>
      </Container>
    </div>
  );
}
