import Link from "next/link";
import { PromoForm } from "../PromoForm";

export const metadata = { title: "New Promo Code — LUMYNAT Admin" };

export default function NewPromoPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/promotions"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Promotions
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Promo Code</h1>
      </div>
      <PromoForm />
    </div>
  );
}
