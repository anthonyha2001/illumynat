import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { Footer } from "@/components/customer/Footer";
import { PromoZone } from "@/components/customer/PromoZone";
import { getActivePromoZone } from "@/lib/data/siteContent";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePromo, supabase] = await Promise.all([
    getActivePromoZone(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  let firstName: string | null = null;
  let isAdmin = false;
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true, email: true, role: true },
    });
    // Use firstName if set, otherwise fall back to the part before @ in email
    firstName = profile?.firstName?.trim() || profile?.email?.split("@")[0] || null;
    isAdmin = profile?.role === "ADMIN";
  }

  return (
    <>
      {activePromo && <PromoZone promo={activePromo} />}
      <Navbar firstName={firstName} isAdmin={isAdmin} />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
