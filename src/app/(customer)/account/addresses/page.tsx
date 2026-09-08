import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AddressBook } from "./AddressBook";

export const metadata = { title: "Addresses — ILLUMYNAT" };

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { profileId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16 max-w-3xl">
        <Link
          href="/account"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-6 block"
        >
          ← Account
        </Link>

        <div className="flex items-center justify-between mb-10">
          <h1 className="font-display text-4xl font-light italic text-text">Addresses</h1>
        </div>

        <AddressBook addresses={addresses} />
      </Container>
    </div>
  );
}
