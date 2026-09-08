"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────

export interface CartCustomization {
  label: string;
  value: string;
  priceModifier: number;
}

export interface CartItem {
  /** Unique key per line — productId + serialized customizations */
  lineId: string;
  productId: string;
  sku: string;
  name: string;
  slug: string;
  price: number;         // base unit price in USD
  quantity: number;
  image?: string;
  customizations: CartCustomization[];
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Drawer controls
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Item management
  addItem: (item: Omit<CartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
}

// ── Line ID — deterministic key per product + customization combo ──

function buildLineId(
  productId: string,
  customizations: CartCustomization[]
): string {
  const sortedCustomizations = [...customizations]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((c) => `${c.label}:${c.value}`)
    .join("|");
  return `${productId}__${sortedCustomizations}`;
}

// ── Store ──────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (incoming) => {
        const lineId = buildLineId(incoming.productId, incoming.customizations);
        const existing = get().items.find((i) => i.lineId === lineId);

        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.lineId === lineId
                ? { ...i, quantity: i.quantity + incoming.quantity }
                : i
            ),
            isOpen: true,
          }));
        } else {
          set((s) => ({
            items: [...s.items, { ...incoming, lineId }],
            isOpen: true,
          }));
        }
      },

      removeItem: (lineId) =>
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.lineId === lineId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "illumynat-cart",   // localStorage key
      partialize: (s) => ({ items: s.items }), // don't persist drawer state
    }
  )
);

// ── Selectors ─────────────────────────────────────────────

export function useCartItemCount() {
  return useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
}

export function useCartSubtotal() {
  return useCartStore((s) =>
    s.items.reduce((sum, item) => {
      const customizationModifier = item.customizations.reduce(
        (mod, c) => mod + c.priceModifier,
        0
      );
      return sum + (item.price + customizationModifier) * item.quantity;
    }, 0)
  );
}
