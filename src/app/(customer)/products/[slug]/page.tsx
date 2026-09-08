import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getProductBySlug } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductStory } from "./ProductStory";
import { ProductReviews } from "./ProductReviews";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — ILLUMYNAT`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  // Check if logged-in user can submit a review
  let canReview      = false;
  let eligibleOrderId: string | undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Must have purchased this product in a completed order
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          profileId: user.id,
          status: { in: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED"] },
        },
      },
      select: { orderId: true },
    });

    if (purchase) {
      // Must not have already reviewed it
      const existing = await prisma.productReview.findUnique({
        where: { profileId_productId: { profileId: user.id, productId: product.id } },
        select: { id: true },
      });
      if (!existing) {
        canReview       = true;
        eligibleOrderId = purchase.orderId;
      }
    }
  }

  return (
    <>
      {/* ── Hero: gallery + info ── */}
      <section className="pt-24 pb-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
            <ProductInfo
              product={product}
              imageUrl={primaryImage?.url}
            />
          </div>
        </Container>
      </section>

      {/* ── Story + fragrance notes ── */}
      <ProductStory
        story={product.story}
        fragranceNotes={product.fragranceNotes}
        name={product.name}
      />

      {/* ── Reviews ── */}
      <ProductReviews
        reviews={product.reviews}
        productId={product.id}
        canReview={canReview}
        eligibleOrderId={eligibleOrderId}
      />
    </>
  );
}
