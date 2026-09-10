import { prisma } from "@/lib/prisma";

export interface SiteSettings {
  TAX_RATE: number;                  // e.g. 0.11
  FREE_SHIPPING_THRESHOLD: number;   // e.g. 75
  SHIPPING_FEE: number;              // e.g. 8.95
  POINTS_PER_DOLLAR: number;         // loyalty: points earned per $1 spent
  POINTS_SIGNUP_BONUS: number;       // points on account creation
  POINTS_REVIEW_BONUS: number;       // points on approved review
  STORE_NAME: string;
  STORE_EMAIL: string;
  STORE_PHONE: string;
}

const DEFAULTS: SiteSettings = {
  TAX_RATE: 0.11,
  FREE_SHIPPING_THRESHOLD: 75,
  SHIPPING_FEE: 8.95,
  POINTS_PER_DOLLAR: 1,
  POINTS_SIGNUP_BONUS: 100,
  POINTS_REVIEW_BONUS: 50,
  STORE_NAME: "LUMYNAT",
  STORE_EMAIL: "hello@lumynat.com",
  STORE_PHONE: "+961 1 000 000",
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    TAX_RATE:                 parseFloat(map.TAX_RATE                 ?? String(DEFAULTS.TAX_RATE)),
    FREE_SHIPPING_THRESHOLD:  parseFloat(map.FREE_SHIPPING_THRESHOLD  ?? String(DEFAULTS.FREE_SHIPPING_THRESHOLD)),
    SHIPPING_FEE:             parseFloat(map.SHIPPING_FEE             ?? String(DEFAULTS.SHIPPING_FEE)),
    POINTS_PER_DOLLAR:        parseFloat(map.POINTS_PER_DOLLAR        ?? String(DEFAULTS.POINTS_PER_DOLLAR)),
    POINTS_SIGNUP_BONUS:      parseInt(  map.POINTS_SIGNUP_BONUS      ?? String(DEFAULTS.POINTS_SIGNUP_BONUS), 10),
    POINTS_REVIEW_BONUS:      parseInt(  map.POINTS_REVIEW_BONUS      ?? String(DEFAULTS.POINTS_REVIEW_BONUS), 10),
    STORE_NAME:                           map.STORE_NAME               ?? DEFAULTS.STORE_NAME,
    STORE_EMAIL:                          map.STORE_EMAIL              ?? DEFAULTS.STORE_EMAIL,
    STORE_PHONE:                          map.STORE_PHONE              ?? DEFAULTS.STORE_PHONE,
  };
}

export async function updateSettings(partial: Partial<SiteSettings>) {
  await prisma.$transaction(
    Object.entries(partial).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
}

export { DEFAULTS as SETTING_DEFAULTS };
