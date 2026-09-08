"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/utils/cn";

const STATUSES = ["ALL", "PENDING", "PAID", "PROCESSING", "FULFILLED", "SHIPPED", "CANCELLED"];

interface Props {
  countMap: Record<string, number>;
  activeStatus?: string;
  activeSearch?: string;
}

export function OrderFilters({ countMap, activeStatus, activeSearch }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const push = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "ALL") next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }, [params, pathname, router]);

  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUSES.map((s) => {
          const count  = s === "ALL" ? total : (countMap[s] ?? 0);
          const active = (s === "ALL" && !activeStatus) || activeStatus === s;
          return (
            <button
              key={s}
              onClick={() => push("status", s)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-body text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
                active
                  ? "bg-accent text-text-on-gold border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className={cn(
                "font-body text-[9px] px-1.5 py-0.5 rounded-full",
                active ? "bg-text-on-gold/20" : "bg-bg-subtle"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="search"
        defaultValue={activeSearch}
        placeholder="Search order number, name, email…"
        onChange={(e) => push("search", e.target.value || null)}
        className="w-full max-w-sm bg-surface border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
      />
    </div>
  );
}
