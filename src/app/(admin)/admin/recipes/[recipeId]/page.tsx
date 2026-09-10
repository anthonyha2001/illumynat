import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RecipeEditor } from "./RecipeEditor";

interface Props { params: Promise<{ recipeId: string }> }

export async function generateMetadata({ params }: Props) {
  const { recipeId } = await params;
  const r = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { name: true } });
  return { title: `Recipe — ${r?.name ?? "Recipe"} — LUMYNAT Admin` };
}

export default async function RecipePage({ params }: Props) {
  const { recipeId } = await params;

  const [recipe, materials] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        name: true,
        product: { select: { id: true, name: true, sku: true } },
        versions: {
          orderBy: { versionNumber: "asc" },
          select: {
            id: true,
            versionNumber: true,
            status: true,
            waxWeight: true,
            yieldQuantity: true,
            notes: true,
            activatedAt: true,
            ingredients: {
              select: {
                id: true,
                quantity: true,
                percentageOfWax: true,
                notes: true,
                rawMaterial: { select: { id: true, name: true, consumptionUnit: true } },
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

  if (!recipe) notFound();

  const serializedMaterials = materials.map((m) => ({
    ...m,
    currentStock: Number(m.currentStock),
    averageCost:  Number(m.averageCost),
  }));

  const serializedVersions = recipe.versions.map((v) => ({
    ...v,
    waxWeight: v.waxWeight != null ? Number(v.waxWeight) : null,
    ingredients: v.ingredients.map((ing) => ({
      ...ing,
      quantity:        Number(ing.quantity),
      percentageOfWax: ing.percentageOfWax != null ? Number(ing.percentageOfWax) : null,
    })),
  }));

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <Link
          href="/admin/lab"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Lab
        </Link>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Recipe</p>
        <h1 className="font-display text-4xl font-light italic text-text">{recipe.name}</h1>
        {recipe.product && (
          <p className="font-body text-sm text-text-muted mt-1">
            Linked to product:{" "}
            <Link href={`/admin/products/${recipe.product.id}`} className="text-accent hover:underline">
              {recipe.product.name}
            </Link>{" "}
            <span className="text-text-faint">({recipe.product.sku})</span>
          </p>
        )}
        {!recipe.product && (
          <p className="font-body text-sm text-text-faint mt-1 italic">No product linked yet</p>
        )}
      </div>

      <RecipeEditor
        recipeId={recipe.id}
        versions={serializedVersions}
        materials={serializedMaterials}
      />
    </div>
  );
}
