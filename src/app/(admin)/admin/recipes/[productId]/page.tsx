import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RecipeEditor } from "./RecipeEditor";

interface Props { params: Promise<{ productId: string }> }

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  return { title: `Recipe — ${p?.name ?? "Product"} — ILLUMYNAT Admin` };
}

export default async function RecipePage({ params }: Props) {
  const { productId } = await params;

  const [product, materials] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true, name: true, sku: true,
        recipe: {
          select: {
            id: true,
            versions: {
              orderBy: { versionNumber: "asc" },
              select: {
                id: true,
                versionNumber: true,
                status: true,
                yieldQuantity: true,
                notes: true,
                activatedAt: true,
                ingredients: {
                  select: {
                    id: true,
                    quantity: true,
                    notes: true,
                    rawMaterial: { select: { id: true, name: true, consumptionUnit: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, consumptionUnit: true, currentStock: true, averageCost: true },
    }),
  ]);

  if (!product) notFound();

  // Serialize Decimals
  const serializedMaterials = materials.map((m) => ({
    ...m,
    currentStock: Number(m.currentStock),
    averageCost:  Number(m.averageCost),
  }));

  const serializedVersions = product.recipe?.versions.map((v) => ({
    ...v,
    ingredients: v.ingredients.map((ing) => ({
      ...ing,
      quantity: Number(ing.quantity),
    })),
  })) ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/recipes"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Recipes
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">{product.name}</h1>
        <p className="font-body text-sm text-text-muted mt-1">{product.sku}</p>
      </div>

      <RecipeEditor
        productId={product.id}
        recipeId={product.recipe?.id ?? null}
        versions={serializedVersions}
        materials={serializedMaterials}
      />
    </div>
  );
}
