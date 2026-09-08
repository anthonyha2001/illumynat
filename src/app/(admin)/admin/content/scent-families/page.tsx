import Link from "next/link";
import { getScentFamilies } from "@/lib/data/siteContent";
import { ScentFamiliesForm } from "./ScentFamiliesForm";

export const metadata = { title: "Scent Families — ILLUMYNAT Admin" };

export default async function ScentFamiliesPage() {
  const families = await getScentFamilies();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/content"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Content
        </Link>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Content</p>
        <h1 className="font-display text-4xl font-light italic text-text">Scent Families</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Add, remove, or reorder the scent families available when creating products.
        </p>
      </div>

      <ScentFamiliesForm initial={families} />
    </div>
  );
}
