import { getPromoZone } from "@/lib/data/siteContent";
import { PromoZoneForm } from "./PromoZoneForm";

export const metadata = { title: "Promo Zone — Admin" };

export default async function PromoZonePage() {
  const promo = await getPromoZone();

  return (
    <div className="p-8 space-y-8">
      <div>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Content</p>
        <h1 className="font-display text-3xl font-light text-text">Promo Zone</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Control the announcement banner that appears at the top of your storefront.
        </p>
      </div>
      <PromoZoneForm initial={promo} />
    </div>
  );
}
