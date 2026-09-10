import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewBatchForm } from "./NewBatchForm";

export const metadata = { title: "New Batch — LUMYNAT Admin" };

export default async function NewBatchPage() {
  // Only products with an ACTIVE recipe version that has at least one ingredient
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      recipe: {
        versions: {
          some: {
            status: "ACTIVE",
            ingredients: { some: {} },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      recipe: {
        select: {
          versions: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              yieldQuantity: true,
              ingredients: {
                select: {
                  quantity: true,
                  rawMaterial: { select: { id: true, name: true, consumptionUnit: true, currentStock: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Serialize Decimal fields for client
  const serialized = products.map((p) => ({
    ...p,
    recipe: p.recipe ? {
      versions: p.recipe.versions.map((v) => ({
        ...v,
        ingredients: v.ingredients.map((ing) => ({
          quantity: Number(ing.quantity),
          rawMaterial: {
            ...ing.rawMaterial,
            currentStock: Number(ing.rawMaterial.currentStock),
          },
        })),
      })),
    } : null,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/production"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Production
        </Link>
        <h1 className="font-display text-4xl font-light italic text-text">New Batch</h1>
      </div>

      {serialized.length === 0 ? (
        <div className="bg-surface border border-border-subtle p-8 text-center max-w-lg">
          <p className="font-display text-xl font-light text-text-muted mb-2">No products ready for production</p>
          <p className="font-body text-sm text-text-muted">
            A product must be <span className="text-text">Active</span> and have an <span className="text-text">Active recipe version</span> before a batch can be started.
          </p>
        </div>
      ) : (
        <NewBatchForm products={serialized} />
      )}
    </div>
  );
}
