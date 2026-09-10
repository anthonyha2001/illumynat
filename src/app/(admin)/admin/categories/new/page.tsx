import Link from "next/link";
import { CategoryForm } from "../CategoryForm";

export const metadata = { title: "New Category — LUMYNAT Admin" };

export default function NewCategoryPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/categories"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Categories
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Category</h1>
      </div>
      <CategoryForm />
    </div>
  );
}
