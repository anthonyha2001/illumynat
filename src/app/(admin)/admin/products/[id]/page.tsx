import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { getScentFamilies } from "@/lib/data/siteContent";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: `Edit ${product?.name ?? "Product"} — LUMYNAT Admin` };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, scentFamilies] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, sku: true,
        description: true, story: true, price: true,
        taxable: true, status: true, categoryId: true,
        scentFamily: true, burnTime: true, netWeight: true,
        waxType: true, fragranceNotes: true, dimensions: true, tags: true,
        images: { orderBy: { position: "asc" }, select: { url: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getScentFamilies(),
  ]);

  if (!product) notFound();

  const toNum = (v: unknown) =>
    typeof v === "number" ? v :
    typeof v === "string" ? parseFloat(v) || 0 :
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber() : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Products
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-light italic text-text">{product.name}</h1>
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200"
          >
            View on Store ↗
          </Link>
        </div>
      </div>

      <ProductForm
        categories={categories}
        scentFamilies={scentFamilies}
        productId={id}
        initial={{
          name:           product.name,
          slug:           product.slug,
          sku:            product.sku,
          description:    product.description,
          story:          product.story ?? "",
          price:          toNum(product.price).toFixed(2),
          taxable:        product.taxable,
          status:         product.status,
          categoryId:     product.categoryId,
          scentFamily:    product.scentFamily ?? "",
          burnTime:       product.burnTime ?? "",
          netWeight:      product.netWeight ?? "",
          waxType:        product.waxType ?? "",
          fragranceNotes: product.fragranceNotes ?? "",
          dimensions:     product.dimensions ?? "",
          imageUrls:      product.images.map((i) => i.url),
          tags:           product.tags,
        }}
      />
    </div>
  );
}
