import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "OPEN" | "CLOSED" | null

  const threads = await prisma.contactThread.findMany({
    where: status ? { status: status as "OPEN" | "CLOSED" } : {},
    orderBy: { updatedAt: "desc" },
    include: {
      profile: { select: { firstName: true, lastName: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  // Count unread (customer messages not yet read)
  const unreadCounts = await Promise.all(
    threads.map(async (t) => {
      const count = await prisma.contactMessage.count({
        where: { threadId: t.id, fromAdmin: false, readAt: null },
      });
      return { threadId: t.id, unread: count };
    })
  );

  const unreadMap = Object.fromEntries(unreadCounts.map(({ threadId, unread }) => [threadId, unread]));

  return NextResponse.json({ threads, unreadMap });
}
