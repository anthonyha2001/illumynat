import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function CustomerThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const raw = await prisma.contactThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!raw || raw.profileId !== user.id) notFound();

  const thread = JSON.parse(JSON.stringify(raw));

  return <ChatClient thread={thread} currentUserId={user.id} isAdmin={false} />;
}
