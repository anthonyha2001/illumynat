"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/stores/cartStore";

// ── Types ──────────────────────────────────────────────────

type CustomizationOption = {
  id: string;
  label: string;
  priceModifier: unknown;
};

type Customization = {
  id: string;
  name: string;
  description: string | null;
  type: "TEXT_INPUT" | "SELECT" | "CHECKBOX";
  isRequired: boolean;
  priceModifier: unknown;
  maxLength: number | null;
  placeholder: string | null;
  options: CustomizationOption[];
};

interface ProductInfoProps {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    price: unknown;
    scentFamily: string | null;
    burnTime: string | null;
    netWeight: unknown;
    waxType: string | null;
    finishedGoods: { quantityOnHand: number } | null;
    customizations: Customization[];
  };
  imageUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
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

// ── Customization inputs ───────────────────────────────────

function TextCustomization({
  c,
  value,
  onChange,
}: {
  c: Customization;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle font-medium">
          {c.name}
          {c.isRequired && <span className="ml-1 text-accent">*</span>}
          {toNum(c.priceModifier) > 0 && (
            <span className="ml-2 text-accent font-normal normal-case">
              +${toNum(c.priceModifier).toFixed(2)}
            </span>
          )}
        </label>
        {c.maxLength && (
          <span className="font-body text-[10px] text-text-faint">
            {value.length}/{c.maxLength}
          </span>
        )}
      </div>
      {c.description && (
        <p className="font-body text-[11px] text-text-faint">{c.description}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={c.maxLength ?? undefined}
        placeholder={c.placeholder ?? ""}
        className={cn(
          "w-full bg-surface border border-border px-3 py-2.5",
          "font-body text-sm text-text placeholder:text-text-faint",
          "focus:border-accent focus:outline-none transition-colors duration-200"
        )}
      />
    </div>
  );
}

function SelectCustomization({
  c,
  value,
  onChange,
}: {
  c: Customization;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle font-medium">
        {c.name}
        {c.isRequired && <span className="ml-1 text-accent">*</span>}
      </label>
      {c.description && (
        <p className="font-body text-[11px] text-text-faint">{c.description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {c.options.map((opt) => {
          const mod = toNum(opt.priceModifier);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "px-4 py-2 font-body text-[11px] tracking-[0.08em] uppercase",
                "border transition-colors duration-200",
                value === opt.id
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border text-text-subtle hover:border-text-muted hover:text-text"
              )}
            >
              {opt.label}
              {mod > 0 && <span className="ml-1 text-accent/70">+${mod.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxCustomization({
  c,
  value,
  onChange,
}: {
  c: Customization;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const mod = toNum(c.priceModifier);
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3",
        "border transition-colors duration-200 text-left",
        value
          ? "border-accent bg-accent/5"
          : "border-border hover:border-text-muted"
      )}
    >
      <div>
        <p className={cn("font-body text-sm", value ? "text-accent" : "text-text")}>
          {c.name}
          {mod > 0 && (
            <span className="ml-2 text-[11px] text-accent/80">+${mod.toFixed(2)}</span>
          )}
        </p>
        {c.description && (
          <p className="font-body text-[11px] text-text-muted mt-0.5">{c.description}</p>
        )}
      </div>
      {/* Visual toggle */}
      <div
        className={cn(
          "w-4 h-4 border flex items-center justify-center shrink-0 transition-colors duration-200",
          value ? "border-accent bg-accent" : "border-border"
        )}
      >
        {value && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ── ProductInfo ────────────────────────────────────────────

export function ProductInfo({ product, imageUrl }: ProductInfoProps) {
  const addItem = useCartStore((s) => s.addItem);

  const price = toNum(product.price);
  const qty = product.finishedGoods?.quantityOnHand;
  const stockSignal = getStockSignal(qty);
  const isSoldOut = stockSignal === "soldout";

  // Customization state: keyed by customization id
  const [textValues, setTextValues]       = useState<Record<string, string>>({});
  const [selectValues, setSelectValues]   = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);

  // Calculate total price modifier from current selections
  const modifierTotal = product.customizations.reduce((sum, c) => {
    if (c.type === "SELECT") {
      const optId = selectValues[c.id];
      const opt = c.options.find((o) => o.id === optId);
      return sum + (opt ? toNum(opt.priceModifier) : 0);
    }
    if (c.type === "CHECKBOX" && checkboxValues[c.id]) {
      return sum + toNum(c.priceModifier);
    }
    if (c.type === "TEXT_INPUT" && textValues[c.id]) {
      return sum + toNum(c.priceModifier);
    }
    return sum;
  }, 0);

  const totalPrice = price + modifierTotal;

  function validate(): string | null {
    for (const c of product.customizations) {
      if (!c.isRequired) continue;
      if (c.type === "TEXT_INPUT" && !textValues[c.id]?.trim()) {
        return `"${c.name}" is required.`;
      }
      if (c.type === "SELECT" && !selectValues[c.id]) {
        return `Please select an option for "${c.name}".`;
      }
    }
    return null;
  }

  const [validationError, setValidationError] = useState<string | null>(null);

  function handleAddToCart() {
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError(null);

    // Build customizations array for cart
    const customizations = product.customizations.flatMap((c) => {
      if (c.type === "TEXT_INPUT") {
        const v = textValues[c.id]?.trim();
        if (!v) return [];
        return [{ id: c.id, label: c.name, value: v, priceModifier: toNum(c.priceModifier) }];
      }
      if (c.type === "SELECT") {
        const opt = c.options.find((o) => o.id === selectValues[c.id]);
        if (!opt) return [];
        return [{ id: c.id, label: c.name, value: opt.label, priceModifier: toNum(opt.priceModifier) }];
      }
      if (c.type === "CHECKBOX") {
        const checked = checkboxValues[c.id] ?? false;
        if (!checked) return [];
        return [{ id: c.id, label: c.name, value: "Yes", priceModifier: toNum(c.priceModifier) }];
      }
      return [];
    });

    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price,
      quantity: 1,
      image: imageUrl,
      customizations,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Scent family */}
      {product.scentFamily && (
        <span className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
          {product.scentFamily}
        </span>
      )}

      {/* Name */}
      <h1 className="font-display text-3xl md:text-4xl font-light text-text leading-snug">
        {product.name}
      </h1>

      {/* Price + stock */}
      <div className="flex items-center gap-4">
        <span className="font-display text-2xl font-light text-text">
          ${totalPrice.toFixed(2)}
        </span>
        {stockSignal === "lowstock" && (
          <Badge variant="lowstock">Only {qty} left</Badge>
        )}
        {stockSignal === "soldout" && (
          <Badge variant="soldout">Sold Out</Badge>
        )}
      </div>

      {/* Meta details */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 py-4 border-y border-border">
        {product.burnTime && (
          <div>
            <p className="font-body text-[10px] tracking-[0.18em] uppercase text-text-muted mb-0.5">Burn time</p>
            <p className="font-body text-sm text-text">{product.burnTime}</p>
          </div>
        )}
        {product.waxType && (
          <div>
            <p className="font-body text-[10px] tracking-[0.18em] uppercase text-text-muted mb-0.5">Wax</p>
            <p className="font-body text-sm text-text">{product.waxType}</p>
          </div>
        )}
        {product.netWeight && (
          <div>
            <p className="font-body text-[10px] tracking-[0.18em] uppercase text-text-muted mb-0.5">Weight</p>
            <p className="font-body text-sm text-text">{String(product.netWeight)}</p>
          </div>
        )}
        <div>
          <p className="font-body text-[10px] tracking-[0.18em] uppercase text-text-muted mb-0.5">SKU</p>
          <p className="font-body text-sm text-text-muted">{product.sku}</p>
        </div>
      </div>

      {/* Customizations */}
      {product.customizations.length > 0 && (
        <div className="space-y-5">
          {product.customizations.map((c) => {
            if (c.type === "TEXT_INPUT") {
              return (
                <TextCustomization
                  key={c.id}
                  c={c}
                  value={textValues[c.id] ?? ""}
                  onChange={(v) => setTextValues((prev) => ({ ...prev, [c.id]: v }))}
                />
              );
            }
            if (c.type === "SELECT") {
              return (
                <SelectCustomization
                  key={c.id}
                  c={c}
                  value={selectValues[c.id] ?? ""}
                  onChange={(v) => setSelectValues((prev) => ({ ...prev, [c.id]: v }))}
                />
              );
            }
            if (c.type === "CHECKBOX") {
              return (
                <CheckboxCustomization
                  key={c.id}
                  c={c}
                  value={checkboxValues[c.id] ?? false}
                  onChange={(v) => setCheckboxValues((prev) => ({ ...prev, [c.id]: v }))}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="font-body text-xs text-error bg-error/5 border border-error/20 px-4 py-3">
          {validationError}
        </p>
      )}

      {/* Add to cart */}
      <motion.div whileTap={{ scale: isSoldOut ? 1 : 0.98 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSoldOut}
          onClick={handleAddToCart}
        >
          {isSoldOut ? "Sold Out" : added ? "Added to Bag ✓" : "Add to Bag"}
        </Button>
      </motion.div>

      {/* Trust micro-copy */}
      <div className="flex flex-col gap-2">
        {[
          "Free shipping on orders over $75",
          "Hand-poured to order — ships in 2–4 business days",
          "Easy returns within 30 days",
        ].map((line) => (
          <p key={line} className="font-body text-[11px] text-text-muted flex items-center gap-2">
            <span className="text-accent">✓</span>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
