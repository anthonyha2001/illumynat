import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { Footer } from "@/components/customer/Footer";
import { PromoZone } from "@/components/customer/PromoZone";
import { getActivePromoZone } from "@/lib/data/siteContent";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activePromo = await getActivePromoZone();

  return (
    <>
      {activePromo && <PromoZone promo={activePromo} />}
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
