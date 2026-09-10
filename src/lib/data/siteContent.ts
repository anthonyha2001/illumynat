import { prisma } from "@/lib/prisma";

// ── Hero content ──────────────────────────────────────────

export interface HeroContent {
  eyebrow:            string;
  headline:           string;
  headlineAccent:     string;
  subCopy:            string;
  primaryCtaLabel:    string;
  primaryCtaHref:     string;
  secondaryCtaLabel:  string;
  secondaryCtaHref:   string;
  imageUrl:           string | null;
}

export const HERO_DEFAULTS: HeroContent = {
  eyebrow:           "Hand-poured in small batches",
  headline:          "Light the moment.",
  headlineAccent:    "Own the room.",
  subCopy:           "Each LUMYNAT candle begins with a single idea: that fragrance is not decoration — it is atmosphere. Discover collections designed to transform every room into a ritual.",
  primaryCtaLabel:   "Shop Collection",
  primaryCtaHref:    "/shop",
  secondaryCtaLabel: "Our Story",
  secondaryCtaHref:  "/our-story",
  imageUrl:          null,
};

export async function getHeroContent(): Promise<HeroContent> {
  const row = await prisma.siteContent.findUnique({ where: { key: "hero" } });
  if (!row) return HERO_DEFAULTS;
  return { ...HERO_DEFAULTS, ...(row.value as Partial<HeroContent>) };
}

export async function setHeroContent(content: HeroContent) {
  await prisma.siteContent.upsert({
    where:  { key: "hero" },
    update: { value: content as object },
    create: { key: "hero", value: content as object },
  });
}

// ── Promo Zone ────────────────────────────────────────────

export type PromoTheme = "DARK" | "LIGHT" | "GOLD";

export interface PromoZoneContent {
  // ── Banner ──
  isActive:     boolean;
  badgeText:    string;
  headline:     string;
  subheadline:  string;
  ctaLabel:     string;
  ctaHref:      string;
  theme:        PromoTheme;
  expiresAt:    string | null;   // ISO string or null

  // ── Promo Page ──
  pageTitle:      string;
  pageSubtitle:   string;
  promoCode:      string | null;
  promoDiscount:  string | null; // e.g. "20% off all candles"
  pageBody:       string;
}

export const PROMO_DEFAULTS: PromoZoneContent = {
  isActive:    false,
  badgeText:   "Limited Time",
  headline:    "Something special is coming.",
  subheadline: "",
  ctaLabel:    "Shop Now",
  ctaHref:     "/shop",
  theme:       "DARK",
  expiresAt:   null,

  pageTitle:     "Exclusive Offer",
  pageSubtitle:  "For a limited time only.",
  promoCode:     null,
  promoDiscount: null,
  pageBody:      "",
};

export async function getPromoZone(): Promise<PromoZoneContent> {
  const row = await prisma.siteContent.findUnique({ where: { key: "promo_zone" } });
  if (!row) return PROMO_DEFAULTS;
  return { ...PROMO_DEFAULTS, ...(row.value as Partial<PromoZoneContent>) };
}

export async function setPromoZone(content: PromoZoneContent) {
  await prisma.siteContent.upsert({
    where:  { key: "promo_zone" },
    update: { value: content as object },
    create: { key: "promo_zone", value: content as object },
  });
}

/** Returns promo zone only if currently active and not expired */
export async function getActivePromoZone(): Promise<PromoZoneContent | null> {
  const promo = await getPromoZone();
  if (!promo.isActive) return null;
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null;
  return promo;
}

// ── Palette ───────────────────────────────────────────────

export interface PaletteContent {
  ivory:      string;   // main background
  cream:      string;   // subtle bg
  parchment:  string;   // muted bg / border subtle
  charcoal:   string;   // dark bg / primary text
  espresso:   string;   // darkest bg
  stone:      string;   // text subtle
  ash:        string;   // text muted
  mist:       string;   // text faint / border
  gold:       string;   // accent
  goldLight:  string;   // accent light
  goldDark:   string;   // accent dark
  goldPale:   string;   // accent pale
  success:    string;
  error:      string;
  warning:    string;
}

export const PALETTE_DEFAULTS: PaletteContent = {
  ivory:     "#FDFAF6",
  cream:     "#F5EDE5",
  parchment: "#EAD9D0",
  charcoal:  "#2D0A12",
  espresso:  "#1A0008",
  stone:     "#6B1A2A",
  ash:       "#8A5A62",
  mist:      "#D4B8BC",
  gold:      "#B8972A",
  goldLight: "#E8D5A0",
  goldDark:  "#8A6E1A",
  goldPale:  "#F5EDD0",
  success:   "#4A7C59",
  error:     "#8B3A3A",
  warning:   "#B8843A",
};

export async function getPalette(): Promise<PaletteContent> {
  const row = await prisma.siteContent.findUnique({ where: { key: "palette" } });
  if (!row) return PALETTE_DEFAULTS;
  return { ...PALETTE_DEFAULTS, ...(row.value as Partial<PaletteContent>) };
}

export async function setPalette(content: PaletteContent) {
  await prisma.siteContent.upsert({
    where:  { key: "palette" },
    update: { value: content as object },
    create: { key: "palette", value: content as object },
  });
}

// ── Scent Families ────────────────────────────────────────

export const SCENT_FAMILY_DEFAULTS: string[] = [
  "Woody", "Fresh", "Floral", "Spiced", "Oriental", "Citrus", "Gourmand",
];

export async function getScentFamilies(): Promise<string[]> {
  const row = await prisma.siteContent.findUnique({ where: { key: "scent_families" } });
  if (!row) return SCENT_FAMILY_DEFAULTS;
  const val = row.value as { families?: string[] };
  return Array.isArray(val?.families) ? val.families : SCENT_FAMILY_DEFAULTS;
}

export async function setScentFamilies(families: string[]) {
  await prisma.siteContent.upsert({
    where:  { key: "scent_families" },
    update: { value: { families } },
    create: { key: "scent_families", value: { families } },
  });
}

/** Converts a PaletteContent object to a CSS :root block string */
export function paletteToCSS(p: PaletteContent): string {
  return `:root {
  --palette-ivory:      ${p.ivory};
  --palette-cream:      ${p.cream};
  --palette-parchment:  ${p.parchment};
  --palette-warm-white: ${p.ivory};
  --palette-charcoal:   ${p.charcoal};
  --palette-espresso:   ${p.espresso};
  --palette-stone:      ${p.stone};
  --palette-ash:        ${p.ash};
  --palette-mist:       ${p.mist};
  --palette-gold:       ${p.gold};
  --palette-gold-light: ${p.goldLight};
  --palette-gold-dark:  ${p.goldDark};
  --palette-gold-pale:  ${p.goldPale};
  --palette-success:    ${p.success};
  --palette-error:      ${p.error};
  --palette-warning:    ${p.warning};
}`;
}
