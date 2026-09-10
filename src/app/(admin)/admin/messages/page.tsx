import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminMessagesClient from "./AdminMessagesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages — Admin" };

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ threadId?: string }> }) {
  const { threadId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role !== "ADMIN") redirect("/");

  const rawThreads = await prisma.contactThread.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      profile: { select: { firstName: true, lastName: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Unread counts per thread
  const unreadRows = await prisma.contactMessage.groupBy({
    by: ["threadId"],
    where: { fromAdmin: false, readAt: null },
    _count: { id: true },
  });
  const unreadMap = Object.fromEntries(unreadRows.map((r) => [r.threadId, r._count.id]));

  const threads = JSON.parse(JSON.stringify(rawThreads));

  // If a specific thread is selected, fetch its messages
  let activeThread = null;
  if (threadId) {
    const raw = await prisma.contactThread.findUnique({
      where: { id: threadId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        profile: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (raw) {
      // Mark unread customer messages as read
      await prisma.contactMessage.updateMany({
        where: { threadId, fromAdmin: false, readAt: null },
        data: { readAt: new Date() },
      });
      activeThread = JSON.parse(JSON.stringify(raw));
    }
  }

  return (
    <AdminMessagesClient
      threads={threads}
      unreadMap={unreadMap}
      initialThread={activeThread}
      currentUserId={user.id}
    />
  );
}
