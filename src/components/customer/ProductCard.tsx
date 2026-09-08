"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import type { ProductListItem } from "@/lib/data/products";

// ── Helpers ────────────────────────────────────────────────

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  // Prisma Decimal object
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function getStockSignal(qty: number | null | undefined) {
  if (qty === null || qty === undefined) return null;
  if (qty === 0) return "soldout";
  if (qty <= 5) return "lowstock";
  return null;
}

// ── Wishlist icon ──────────────────────────────────────────

function IconHeart({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      fill={filled ? "currentColor" : "none"}>
      <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.3 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── ProductCard ────────────────────────────────────────────

interface ProductCardProps {
  product: ProductListItem;
  badge?: "new" | "bestseller" | "limited";
  priority?: boolean;
  initialWishlisted?: boolean;
}

export function ProductCard({ product, badge, priority = false, initialWishlisted = false }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setWishlisted((w) => !w); // optimistic
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) {
        // Not logged in — revert and redirect
        setWishlisted((w) => !w);
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setWishlisted((w) => !w); // revert on server error
        return;
      }
      const data = await res.json();
      setWishlisted(data.wishlisted); // use actual server value
    } catch {
      setWishlisted((w) => !w); // revert on network error
    } finally {
      setWishlistLoading(false);
    }
  }

  const price = typeof product.price === "number" ? product.price : toNumber(product.price);
  const qty = product.finishedGoods?.quantityOnHand;
  const stockSignal = getStockSignal(qty);
  const isSoldOut = stockSignal === "soldout";
  const imageUrl = product.images[0]?.url;
  const imageAlt = product.images[0]?.altText ?? product.name;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (isSoldOut) return;

    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price,
      quantity: 1,
      image: imageUrl,
      customizations: [],
    });

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col"
    >
      {/* ── Image wrapper ── */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden bg-bg-subtle aspect-[3/4]"
        tabIndex={-1}
        aria-hidden
      >
        {imageUrl ? (
          <motion.div
            animate={{ scale: hovered ? 1.04 : 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
              priority={priority}
            />
          </motion.div>
        ) : (
          // Placeholder when no image uploaded yet
          <div className="w-full h-full flex items-center justify-center bg-bg-subtle">
            <span className="font-display text-5xl text-text-faint italic">I</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && <Badge variant={badge}>{badge === "bestseller" ? "Best Seller" : badge === "limited" ? "Limited" : "New"}</Badge>}
          {stockSignal === "lowstock" && (
            <Badge variant="lowstock">Only {qty} left</Badge>
          )}
          {stockSignal === "soldout" && (
            <Badge variant="soldout">Sold Out</Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-3 right-3",
            "w-8 h-8 flex items-center justify-center",
            "bg-surface/80 backdrop-blur-sm",
            "transition-all duration-300",
            hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          )}
        >
          <IconHeart
            filled={wishlisted}
            className={cn("w-4 h-4", wishlisted ? "text-error" : "text-text-subtle")}
          />
        </button>

        {/* Quick-add CTA — appears on hover */}
        <AnimatePresence>
          {hovered && !isSoldOut && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 bottom-3"
            >
              <Button
                variant="dark"
                size="sm"
                fullWidth
                onClick={handleQuickAdd}
                className="backdrop-blur-sm bg-bg-dark/90"
              >
                {addedFeedback ? "Added to Bag ✓" : "Quick Add"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* ── Product info ── */}
      <div className="flex flex-col gap-1 pt-4">
        {product.scentFamily && (
          <span className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
            {product.scentFamily}
          </span>
        )}

        <Link href={`/products/${product.slug}`} className="group/link">
          <h3 className="font-display text-lg font-light text-text leading-snug group-hover/link:text-accent transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-1">
          <span className="font-body text-sm text-text">
            ${price.toFixed(2)}
          </span>
          {product.burnTime && (
            <span className="font-body text-[11px] text-text-muted">
              {product.burnTime} burn
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
