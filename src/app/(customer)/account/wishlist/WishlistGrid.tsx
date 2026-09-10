"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/utils/cn";

interface WishlistProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  scentFamily: string | null;
  burnTime: string | null;
  netWeight: string | null;
  status: string;
  images: { url: string; altText: string | null }[];
  finishedGoods: { quantityOnHand: number } | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: Date;
  product: WishlistProduct;
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.3 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: string) => void }) {
  const addItem  = useCartStore((s) => s.addItem);
  const [added, setAdded]     = useState(false);
  const [removing, setRemoving] = useState(false);

  const { product } = item;
  const imageUrl    = product.images[0]?.url;
  const isSoldOut   = (product.finishedGoods?.quantityOnHand ?? 1) === 0;

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) { setRemoving(false); return; }
      onRemove(item.id);
    } catch {
      setRemoving(false);
    }
  }

  function handleAddToCart() {
    if (isSoldOut) return;
    addItem({
      productId:      product.id,
      sku:            product.sku,
      name:           product.name,
      slug:           product.slug,
      price:          product.price,
      quantity:       1,
      image:          imageUrl,
      customizations: [],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={cn("group bg-surface border border-border-subtle flex flex-col transition-opacity duration-300", removing && "opacity-40 pointer-events-none")}>
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-bg-subtle">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.images[0]?.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-5xl italic text-text-faint">I</span>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-bg-dark/50 flex items-center justify-center">
            <span className="font-body text-[11px] tracking-widest uppercase text-text-inverse/80 bg-bg-dark/70 px-3 py-1">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {product.scentFamily && (
          <span className="font-body text-[10px] tracking-[0.15em] uppercase text-text-muted">
            {product.scentFamily}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="font-display text-lg font-light text-text hover:text-accent transition-colors duration-200 leading-snug">
          {product.name}
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-body text-sm text-text">${product.price.toFixed(2)}</span>
          {product.burnTime && (
            <span className="font-body text-[11px] text-text-muted">{product.burnTime}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className={cn(
              "flex-1 font-body text-[11px] tracking-[0.12em] uppercase py-2.5 border transition-colors duration-200",
              isSoldOut
                ? "border-border text-text-faint cursor-not-allowed"
                : added
                ? "border-success text-success"
                : "border-accent text-accent hover:bg-accent hover:text-text-on-gold"
            )}
          >
            {added ? "Added ✓" : isSoldOut ? "Sold Out" : "Add to Bag"}
          </button>
          <button
            onClick={handleRemove}
            aria-label="Remove from wishlist"
            className="w-10 h-10 flex items-center justify-center border border-border text-error/60 hover:border-error hover:text-error transition-colors duration-200 shrink-0"
          >
            <IconHeart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const [visible, setVisible] = useState(items.map((i) => i.id));

  function handleRemove(id: string) {
    setTimeout(() => setVisible((v) => v.filter((x) => x !== id)), 350);
  }

  const shown = items.filter((i) => visible.includes(i.id));

  if (shown.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <p className="font-display text-2xl font-light text-text">All clear</p>
        <p className="font-body text-sm text-text-muted">You&apos;ve removed everything from your wishlist.</p>
        <a href="/shop" className="font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-6 py-3 hover:bg-accent hover:text-text-on-gold transition-colors duration-200">
          Keep Browsing
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
      {shown.map((item) => (
        <WishlistCard key={item.id} item={item} onRemove={handleRemove} />
      ))}
    </div>
  );
}
