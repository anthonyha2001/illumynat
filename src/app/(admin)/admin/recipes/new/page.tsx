import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New Recipe — LUMYNAT Admin" };

export default async function NewRecipePage() {
  const products = await prisma.product.findMany({
    where: {
      status: { not: "ARCHIVED" },
      recipe: null,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true },
  });

  async function createRecipe(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const name      = (formData.get("name") as string)?.trim();
    const productId = (formData.get("productId") as string) || null;
    if (!name) return;

    const recipe = await prisma.recipe.create({
      data: { name, productId: productId || null },
      select: { id: true },
    });

    redirect(`/admin/recipes/${recipe.id}`);
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <Link
          href="/admin/lab"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Lab
        </Link>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-1">Lab</p>
        <h1 className="font-display text-4xl font-light italic text-text">New Recipe</h1>
        <p className="font-body text-sm text-text-muted mt-2 max-w-sm">
          Recipes are the source formula. Define the recipe first — set the wax weight and ingredient percentages — then assign it to a product when ready.
        </p>
      </div>

      <form action={createRecipe} className="bg-surface border border-border-subtle p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle">
            Recipe Name <span className="text-error">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Amber & Sandalwood Soy"
            className="w-full bg-bg border border-border px-3 py-2.5 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
          />
          <p className="font-body text-[10px] text-text-faint">
            Give it a descriptive name — this is your internal lab reference, not the product name.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-subtle">
            Link to Product <span className="text-text-faint font-normal">(optional)</span>
          </label>
          <select
            name="productId"
            className="w-full bg-bg border border-border px-3 py-2.5 font-body text-sm text-text focus:border-accent focus:outline-none transition-colors duration-200"
          >
            <option value="">— Unassigned for now —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          <p className="font-body text-[10px] text-text-faint">
            Only shows products without an existing recipe.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent text-text-on-gold font-body text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
          >
            Create Recipe →
          </button>
          <Link
            href="/admin/lab"
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
