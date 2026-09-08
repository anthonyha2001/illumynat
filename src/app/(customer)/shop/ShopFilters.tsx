"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/utils/cn";
import type { ProductSortKey } from "@/lib/data/products";

interface Props {
  scentFamilies: string[];
  activeScent?: string;
  activeSort: ProductSortKey;
  activeSearch?: string;
}

const SORT_OPTIONS: { label: string; value: ProductSortKey }[] = [
  { label: "Newest",       value: "newest" },
  { label: "Price: Low",   value: "price_asc" },
  { label: "Price: High",  value: "price_desc" },
  { label: "Name A–Z",     value: "name_asc" },
];

export function ShopFilters({ scentFamilies, activeScent, activeSort, activeSearch }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const push = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const hasFilters = !!(activeScent || activeSearch || (activeSort && activeSort !== "newest"));

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle mb-3">
          Search
        </p>
        <input
          type="search"
          defaultValue={activeSearch}
          placeholder="Fragrance, notes…"
          onChange={(e) => push("search", e.target.value)}
          className={cn(
            "w-full bg-surface border border-border px-3 py-2.5",
            "font-body text-sm text-text placeholder:text-text-faint",
            "focus:border-accent focus:outline-none transition-colors duration-200"
          )}
        />
      </div>

      {/* Sort */}
      <div>
        <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle mb-3">
          Sort By
        </p>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => push("sort", opt.value === "newest" ? null : opt.value)}
              className={cn(
                "w-full text-left font-body text-sm px-0 py-1.5",
                "transition-colors duration-150",
                activeSort === opt.value
                  ? "text-accent font-medium"
                  : "text-text-muted hover:text-text"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scent family */}
      {scentFamilies.length > 0 && (
        <div>
          <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle mb-3">
            Scent Family
          </p>
          <div className="space-y-1">
            {scentFamilies.map((family) => (
              <button
                key={family}
                onClick={() => push("scent", activeScent === family ? null : family)}
                className={cn(
                  "w-full text-left font-body text-sm px-0 py-1.5",
                  "transition-colors duration-150",
                  activeScent === family
                    ? "text-accent font-medium"
                    : "text-text-muted hover:text-text"
                )}
              >
                {family}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="font-body text-[11px] tracking-[0.12em] uppercase text-text-faint hover:text-error transition-colors duration-150"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
