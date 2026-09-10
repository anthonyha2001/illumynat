"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { signOut } from "@/lib/actions/auth";

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={cn("w-4 h-4 shrink-0", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Nav structure ────────────────────────────────────────────
// Groups with section headers. null label = no header (standalone items).
const NAV_GROUPS = [
  {
    label: null,
    items: [
      {
        label: "Overview",
        href:  "/admin",
        exact: true,
        icon:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        label: "Orders",
        href:  "/admin/orders",
        icon:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: "Lab",
        href:  "/admin/lab",
        icon:  "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      },
      {
        label: "CRM",
        href:  "/admin/crm",
        icon:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Materials",
        href:  "/admin/inventory",
        icon:  "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      },
      {
        label: "Categories",
        href:  "/admin/categories",
        icon:  "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        label: "Promotions",
        href:  "/admin/promotions",
        icon:  "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
      {
        label: "Gift Sets",
        href:  "/admin/gift-sets",
        icon:  "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
      },
      {
        label: "Gift Cards",
        href:  "/admin/gift-cards",
        icon:  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      },
      {
        label: "Promo Zone",
        href:  "/admin/content/promo-zone",
        icon:  "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: "Accounting",
        href:  "/admin/accounting",
        icon:  "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M15 11h.01M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
      },
      {
        label: "Content",
        href:  "/admin/content",
        icon:  "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
      },
      {
        label: "Settings",
        href:  "/admin/settings",
        icon:  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
] as const;

interface AdminSidebarProps {
  badges?: Record<string, number | undefined>;
}

export function AdminSidebar({ badges = {} }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-52 shrink-0 bg-bg-darker min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-text-inverse/5">
        <Link href="/admin" className="font-display text-xl font-light tracking-[0.2em] uppercase text-text-inverse">
          LUMYNAT
        </Link>
        <p className="font-body text-[9px] tracking-widest uppercase text-text-inverse/25 mt-0.5">
          Admin Portal
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {/* Group label */}
            {group.label && (
              <p className="px-3 mb-1 font-body text-[9px] tracking-[0.18em] uppercase text-text-inverse/25 font-medium">
                {group.label}
              </p>
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, "exact" in item ? item.exact : false);
                const badge  = badges[item.href];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 font-body text-[11px] tracking-[0.06em] uppercase transition-colors duration-150 rounded-sm",
                      active
                        ? "bg-accent/15 text-accent"
                        : "text-text-inverse/45 hover:text-text-inverse/75 hover:bg-text-inverse/5"
                    )}
                  >
                    <Icon d={item.icon} />
                    <span className="flex-1 leading-none">{item.label}</span>
                    {badge && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-accent text-text-on-gold font-body text-[9px] font-medium rounded-full">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-text-inverse/5 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 font-body text-[11px] tracking-[0.06em] uppercase text-text-inverse/25 hover:text-text-inverse/55 transition-colors duration-150 rounded-sm"
        >
          <Icon d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          View Store
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 font-body text-[11px] tracking-[0.06em] uppercase text-text-inverse/25 hover:text-error transition-colors duration-150 rounded-sm"
          >
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
