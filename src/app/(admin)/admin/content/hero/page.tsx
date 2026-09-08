import { getHeroContent } from "@/lib/data/siteContent";
import { HeroForm } from "./HeroForm";

export const metadata = { title: "Hero Section — Admin" };

export default async function HeroContentPage() {
  const hero = await getHeroContent();

  return (
    <div className="p-8 space-y-8">
      <div>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Content</p>
        <h1 className="font-display text-3xl font-light text-text">Hero Section</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Edit the opening hero on your homepage — change copy for holidays, campaigns, or launches without touching code.
        </p>
      </div>
      <HeroForm initial={hero} />
    </div>
  );
}
