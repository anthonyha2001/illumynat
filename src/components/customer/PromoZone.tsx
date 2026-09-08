import Link from "next/link";
import type { PromoZoneContent } from "@/lib/data/siteContent";

interface Props {
  promo: PromoZoneContent;
}

export function PromoZone({ promo }: Props) {
  const themeClass =
    promo.theme === "GOLD"  ? "bg-accent text-text-on-gold" :
    promo.theme === "LIGHT" ? "bg-surface border-b border-border-subtle text-text" :
                              "bg-bg-darker text-text-inverse";

  const badgeClass =
    promo.theme === "GOLD"  ? "border-text-on-gold/30 text-text-on-gold/80" :
    promo.theme === "LIGHT" ? "border-border text-text-muted" :
                              "border-white/20 text-white/60";

  const ctaClass =
    promo.theme === "GOLD"  ? "text-text-on-gold underline underline-offset-2 hover:opacity-70" :
    promo.theme === "LIGHT" ? "text-accent underline underline-offset-2 hover:opacity-70" :
                              "text-accent underline underline-offset-2 hover:opacity-70";

  return (
    <div className={`w-full py-2.5 px-4 ${themeClass}`}>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {promo.badgeText && (
          <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 border ${badgeClass} shrink-0`}>
            {promo.badgeText}
          </span>
        )}

        <div className="flex items-center gap-3 text-center">
          <p className="font-display text-sm font-light">{promo.headline}</p>
          {promo.subheadline && (
            <p className="font-body text-[11px] opacity-60 hidden sm:block">{promo.subheadline}</p>
          )}
        </div>

        {promo.ctaLabel && promo.ctaHref && (
          <Link
            href={promo.ctaHref}
            className={`font-body text-[10px] tracking-widest uppercase shrink-0 transition-opacity duration-150 ${ctaClass}`}
          >
            {promo.ctaLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
