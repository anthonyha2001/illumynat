import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Edit Profile — LUMYNAT" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, email: true, phone: true },
  });

  if (!profile) redirect("/account");

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-16 max-w-xl">
        <Link
          href="/account"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-6 block"
        >
          ← Account
        </Link>

        <h1 className="font-display text-4xl font-light italic text-text mb-10">
          Edit Profile
        </h1>

        <ProfileForm profile={profile} email={user.email ?? profile.email} />
      </Container>
    </div>
  );
}
