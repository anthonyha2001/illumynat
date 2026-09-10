import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../CategoryForm";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  return { title: `${cat?.name ?? "Category"} — LUMYNAT Admin` };
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true, isActive: true },
  });

  if (!category) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/categories"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Categories
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">{category.name}</h1>
      </div>
      <CategoryForm
        categoryId={category.id}
        initial={{
          name:        category.name,
          slug:        category.slug,
          description: category.description ?? "",
          imageUrl:    category.imageUrl    ?? "",
          isActive:    category.isActive,
        }}
      />
    </div>
  );
}
