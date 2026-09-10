import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CustomerNotificationsClient } from "./CustomerNotificationsClient";

export const metadata = { title: "Notifications — LUMYNAT" };

export default async function AccountNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = await prisma.customerNotification.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const notifications = JSON.parse(JSON.stringify(raw));

  return <CustomerNotificationsClient notifications={notifications} />;
}
