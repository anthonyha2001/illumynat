"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import {
  useCartStore,
  useCartSubtotal,
  type CartItem,
} from "@/stores/cartStore";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";

// ── Icons ──────────────────────────────────────────────────
function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
function IconMinus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// ── Cart Line Item ─────────────────────────────────────────
function CartLineItem({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const linePrice =
    (item.price +
      item.customizations.reduce((sum, c) => sum + c.priceModifier, 0)) *
    item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 py-5"
    >
      {/* Product image */}
      <div className="relative w-20 h-24 bg-bg-subtle shrink-0 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconBag className="w-6 h-6 text-text-faint" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.slug}`}
          className="font-display text-base font-light text-text hover:text-accent transition-colors duration-200 line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>

        {/* Customizations */}
        {item.customizations.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.customizations.map((c, i) => (
              <p key={i} className="font-body text-[11px] text-text-muted">
                {c.label}: <span className="text-text-subtle">{c.value}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-border">
            <button
              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text transition-colors duration-150"
            >
              <IconMinus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-body text-xs text-text">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
              aria-label="Increase quantity"
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text transition-colors duration-150"
            >
              <IconPlus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-text">
              ${linePrice.toFixed(2)}
            </span>
            <button
              onClick={() => removeItem(item.lineId)}
              aria-label="Remove item"
              className="text-text-faint hover:text-error transition-colors duration-150"
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ─────────────────────────────────────────────
function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center">
        <IconBag className="w-7 h-7 text-text-faint" />
      </div>
      <div className="space-y-2">
        <p className="font-display text-2xl font-light text-text">
          Your bag is empty
        </p>
        <p className="font-body text-sm text-text-muted leading-relaxed">
          Discover our handcrafted collection and find your perfect scent.
        </p>
      </div>
      <Button variant="secondary" onClick={onClose} size="md">
        Explore Collection
      </Button>
    </div>
  );
}

// ── Cart Drawer ─────────────────────────────────────────────
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const closeCart = useCartStore((s) => s.closeCart);
  const subtotal = useCartSubtotal();

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const TAX_RATE = 0.11;
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-bg-dark/40 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface flex flex-col shadow-2xl"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <span className="font-display text-xl font-light text-text">
                  Your Bag
                </span>
                {items.length > 0 && (
                  <span className="font-body text-[11px] text-text-muted tracking-widest">
                    ({items.reduce((s, i) => s + i.quantity, 0)}{" "}
                    {items.reduce((s, i) => s + i.quantity, 0) === 1
                      ? "item"
                      : "items"}
                    )
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="text-text-muted hover:text-text transition-colors duration-200"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Items or empty state */}
            {items.length === 0 ? (
              <EmptyCart onClose={closeCart} />
            ) : (
              <>
                {/* Scrollable items */}
                <div className="flex-1 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <div key={item.lineId}>
                        <CartLineItem item={item} />
                        {i < items.length - 1 && (
                          <Divider className="opacity-60" />
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer — order summary + CTA */}
                <div className="border-t border-border-subtle px-6 pt-5 pb-8 space-y-4">
                  {/* Subtotal / tax */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-body text-xs text-text-muted tracking-wide">Subtotal</span>
                      <span className="font-body text-sm text-text">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-xs text-text-muted tracking-wide">Tax (11%)</span>
                      <span className="font-body text-sm text-text">${taxAmount.toFixed(2)}</span>
                    </div>
                    <Divider className="opacity-50" />
                    <div className="flex justify-between">
                      <span className="font-body text-sm font-medium text-text tracking-wide">Total</span>
                      <span className="font-display text-xl font-light text-text">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Free shipping nudge */}
                  {subtotal < 75 && (
                    <div className="bg-accent-pale px-3 py-2.5">
                      <p className="font-body text-[11px] text-text-subtle text-center leading-relaxed">
                        Add{" "}
                        <span className="font-medium text-text">
                          ${(75 - subtotal).toFixed(2)}
                        </span>{" "}
                        more for free shipping
                      </p>
                      <div className="mt-1.5 h-0.5 bg-border-subtle rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((subtotal / 75) * 100, 100)}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  )}

                  <Button href="/checkout" variant="primary" fullWidth size="lg" onClick={closeCart}>
                    Proceed to Checkout
                  </Button>

                  <button
                    onClick={closeCart}
                    className="w-full font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-text transition-colors duration-200 text-center"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
