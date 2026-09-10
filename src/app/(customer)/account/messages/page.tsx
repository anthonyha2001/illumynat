import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CustomerMessagesClient from "./CustomerMessagesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Messages — ILLUMYNAT" };

export default async function CustomerMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const raw = await prisma.contactThread.findMany({
    where: { profileId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const threads = JSON.parse(JSON.stringify(raw));

  return <CustomerMessagesClient threads={threads} />;
}
