"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { useCartStore, useCartItemCount } from "@/stores/cartStore";
import { Container } from "@/components/ui/Container";

const NAV_LINKS = [
  { label: "Shop",        href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Our Story",   href: "/our-story" },
  { label: "Gifting",     href: "/gifting" },
] as const;

// ── Icons ──────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" strokeLinecap="round" />
    </svg>
  );
}
function IconAccount() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.3 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

// ── Cart button — isolated so its Zustand subscription
//    doesn't block the hamburger's useState ──────────────────
function CartButton({ mobile }: { mobile?: boolean }) {
  const openCart = useCartStore((s) => s.openCart);
  const itemCount = useCartItemCount();
  return (
    <button
      aria-label={`Shopping bag, ${itemCount} items`}
      onClick={openCart}
      className={cn(
        "relative",
        mobile ? "text-text" : "text-text-subtle hover:text-text transition-colors duration-200"
      )}
    >
      <IconBag />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center font-body text-[9px] font-medium text-text-on-gold">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}

// ── Navbar ─────────────────────────────────────────────────
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-bg/95 backdrop-blur-sm transition-shadow duration-300",
          scrolled && "shadow-[0_1px_0_0_var(--color-border-subtle)]"
        )}
      >
        <Container>
          <nav className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-display text-2xl md:text-3xl font-light tracking-[0.25em] uppercase text-text"
            >
              ILLUMYNAT
            </Link>

            {/* Desktop nav links */}
            <ul className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative font-body text-[11px] font-medium tracking-[0.15em] uppercase",
                      "text-text-subtle hover:text-text transition-colors duration-200",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px",
                      "after:bg-accent after:scale-x-0 after:origin-left",
                      "after:transition-transform after:duration-300 hover:after:scale-x-100"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop icons */}
            <div className="hidden md:flex items-center gap-5 text-text-subtle">
              <button aria-label="Search" className="hover:text-text transition-colors duration-200">
                <IconSearch />
              </button>
              <Link href="/account/wishlist" aria-label="Wishlist" className="hover:text-text transition-colors duration-200">
                <IconHeart />
              </Link>
              <Link href="/account" aria-label="Account" className="hover:text-text transition-colors duration-200">
                <IconAccount />
              </Link>
              <CartButton />
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex md:hidden items-center gap-4">
              <CartButton mobile />
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
                className="text-text p-2 -mr-2"
              >
                {open ? <IconClose /> : <IconMenu />}
              </button>
            </div>

          </nav>
        </Container>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-bg pt-16 flex flex-col overflow-y-auto md:hidden">
          <Container className="flex flex-col pb-12">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-5 font-display text-3xl font-light text-text border-b border-border-subtle"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-6 pt-8">
              <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 text-text-subtle">
                <IconAccount />
                <span className="font-body text-xs tracking-widest uppercase">Account</span>
              </Link>
              <Link href="/account/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2 text-text-subtle">
                <IconHeart />
                <span className="font-body text-xs tracking-widest uppercase">Wishlist</span>
              </Link>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
