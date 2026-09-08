import { getPalette } from "@/lib/data/siteContent";
import { PaletteForm } from "./PaletteForm";

export const metadata = { title: "Palette — Admin" };

export default async function PalettePage() {
  const palette = await getPalette();

  return (
    <div className="p-8 space-y-8">
      <div>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Content</p>
        <h1 className="font-display text-3xl font-light text-text">Color Palette</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Repaint the entire storefront by changing these values — no code required.
          All 50+ color tokens on the site derive from this palette.
        </p>
      </div>
      <PaletteForm initial={palette} />
    </div>
  );
}
