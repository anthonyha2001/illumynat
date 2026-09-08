import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "New Product — ILLUMYNAT Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Products
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Product</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
