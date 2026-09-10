import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.customerNotification.findMany({
      where: { profileId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.customerNotification.count({ where: { profileId: user.id, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, all } = await req.json();

  if (all) {
    await prisma.customerNotification.updateMany({
      where: { profileId: user.id },
      data: { isRead: true },
    });
  } else if (Array.isArray(ids) && ids.length) {
    await prisma.customerNotification.updateMany({
      where: { profileId: user.id, id: { in: ids } },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
