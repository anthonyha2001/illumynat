import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "New Product — ILLUMYNAT Admin" };

async function generateUniqueSku(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const digits = Math.floor(1000000000 + Math.random() * 9000000000); // 10 random digits
    const sku = `528${digits}`;
    const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
    if (!existing) return sku;
  }
  // Fallback: timestamp-based
  return `528${Date.now().toString().slice(-6)}`;
}

export default async function NewProductPage() {
  const [categories, sku] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    generateUniqueSku(),
  ]);

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
      <ProductForm categories={categories} initial={{ sku }} />
    </div>
  );
}
