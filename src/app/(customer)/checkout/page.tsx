import { Container } from "@/components/ui/Container";
import { CheckoutClient } from "./CheckoutClient";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data/settings";

export const metadata = { title: "Checkout — LUMYNAT" };

export default async function CheckoutPage() {
  const settings = await getSettings();

  let prefill: {
    firstName: string; lastName: string; email: string; phone: string;
    address1: string; address2: string; city: string; state: string; zip: string; country: string;
  } | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: {
          firstName: true, lastName: true, email: true, phone: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
            select: {
              firstName: true, lastName: true,
              addressLine1: true, addressLine2: true,
              city: true, state: true, zipCode: true, country: true,
            },
          },
        },
      });

      if (profile) {
        const addr = profile.addresses[0];
        prefill = {
          firstName: addr?.firstName ?? profile.firstName,
          lastName:  addr?.lastName  ?? profile.lastName,
          email:     profile.email,
          phone:     profile.phone ?? "",
          address1:  addr?.addressLine1 ?? "",
          address2:  addr?.addressLine2 ?? "",
          city:      addr?.city    ?? "",
          state:     addr?.state   ?? "",
          zip:       addr?.zipCode ?? "",
          country:   addr?.country ?? "LB",
        };
      }
    }
  } catch {
    // Not signed in or profile fetch failed — proceed as guest
  }

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-10 md:py-16">
        <div className="mb-8 md:mb-12">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-2">
            Secure Checkout
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light italic text-text">
            Complete Your Order
          </h1>
        </div>
        <CheckoutClient prefill={prefill} settings={settings} />
      </Container>
    </div>
  );
}
