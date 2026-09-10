import Link from "next/link";
import { MaterialForm } from "../MaterialForm";

export const metadata = { title: "New Material — LUMYNAT Admin" };

export default function NewMaterialPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/inventory?tab=materials"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Inventory
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Raw Material</h1>
      </div>
      <MaterialForm />
    </div>
  );
}
