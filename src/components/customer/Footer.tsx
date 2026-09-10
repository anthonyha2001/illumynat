import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { NewsletterForm } from "@/components/customer/NewsletterForm";

const SHOP_LINKS = [
  { label: "All Products",       href: "/shop" },
  { label: "New Arrivals",       href: "/shop?filter=new" },
  { label: "Best Sellers",       href: "/shop?filter=bestsellers" },
  { label: "Limited Editions",   href: "/shop?filter=limited" },
  { label: "Gift Sets",          href: "/gifting" },
];

const COMPANY_LINKS = [
  { label: "Our Story",     href: "/our-story" },
  { label: "Reviews",       href: "/reviews" },
  { label: "Ingredients",   href: "/ingredients" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Press",         href: "/press" },
];

const HELP_LINKS = [
  { label: "FAQ",               href: "/faq" },
  { label: "Shipping & Returns",href: "/shipping" },
  { label: "Care Guide",        href: "/care" },
  { label: "Contact Us",        href: "/contact" },
  { label: "Track Order",       href: "/account/orders" },
];

// ── Social Icons ───────────────────────────────────────────
function IconInstagram() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconPinterest() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.76 1.23-5.22 1.23-5.22s-.31-.63-.31-1.56c0-1.47.85-2.56 1.91-2.56.9 0 1.34.68 1.34 1.49 0 .91-.58 2.27-.88 3.53-.25 1.05.53 1.91 1.56 1.91 1.87 0 3.13-2.4 3.13-5.24 0-2.16-1.45-3.77-4.08-3.77-2.98 0-4.83 2.22-4.83 4.71 0 .85.25 1.45.64 1.91.18.21.2.3.14.55-.07.3-.22.91-.29 1.16-.09.35-.37.48-.68.34-1.91-.78-2.8-2.87-2.8-5.22 0-3.87 3.27-8.51 9.79-8.51 5.21 0 8.64 3.77 8.64 7.82 0 5.37-2.97 9.37-7.32 9.37-1.47 0-2.86-.79-3.34-1.69l-.91 3.49c-.33 1.24-.95 2.48-1.56 3.43.55.17 1.13.26 1.73.26 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}
function IconTiktok() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

// ── Footer ─────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="bg-bg-dark text-text-inverse pt-20 pb-10 mt-auto">
      <Container>

        {/* Top row — brand statement + newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 pb-16 border-b border-white/10">
          {/* Brand */}
          <div className="space-y-4">
            <p className="font-display text-4xl md:text-5xl font-light italic leading-tight text-text-inverse">
              Scent is the strongest<br />form of memory.
            </p>
            <p className="font-body text-sm text-text-inverse/50 leading-relaxed max-w-sm">
              Each ILLUMYNAT candle is hand-poured in small batches using the
              finest raw materials, crafted to become part of your daily ritual.
            </p>
          </div>

          {/* Newsletter */}
          <div className="space-y-4 lg:pt-2">
            <div className="space-y-1">
              <p className="font-body text-[11px] tracking-[0.18em] uppercase text-text-inverse/50">
                The ILLUMYNAT Circle
              </p>
              <p className="font-display text-2xl font-light text-text-inverse">
                Join our community
              </p>
            </div>
            <p className="font-body text-sm text-text-inverse/50 leading-relaxed">
              New collections, scent stories, and exclusive offers — delivered
              with intention.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-14 border-b border-white/10">
          {/* Logo col */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="font-display text-2xl font-light tracking-[0.25em] uppercase text-text-inverse">
              ILLUMYNAT
            </Link>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" aria-label="Instagram" className="text-text-inverse/40 hover:text-accent transition-colors duration-200">
                <IconInstagram />
              </a>
              <a href="#" aria-label="Pinterest" className="text-text-inverse/40 hover:text-accent transition-colors duration-200">
                <IconPinterest />
              </a>
              <a href="#" aria-label="TikTok" className="text-text-inverse/40 hover:text-accent transition-colors duration-200">
                <IconTiktok />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-text-inverse/30">Shop</p>
            <ul className="space-y-3">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-body text-sm text-text-inverse/60 hover:text-text-inverse transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-text-inverse/30">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-body text-sm text-text-inverse/60 hover:text-text-inverse transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="space-y-4">
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-text-inverse/30">Help</p>
            <ul className="space-y-3">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-body text-sm text-text-inverse/60 hover:text-text-inverse transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="font-body text-[11px] text-text-inverse/30 tracking-wide">
            © {new Date().getFullYear()} ILLUMYNAT. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((l) => (
              <Link
                key={l}
                href="#"
                className="font-body text-[11px] text-text-inverse/30 hover:text-text-inverse/60 transition-colors duration-200 tracking-wide"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

      </Container>
    </footer>
  );
}
