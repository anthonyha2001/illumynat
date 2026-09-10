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
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const unreadOnly = searchParams.get("unread") === "true";

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminNotification.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, all } = await req.json();

  if (all) {
    await prisma.adminNotification.updateMany({ data: { isRead: true } });
  } else if (Array.isArray(ids) && ids.length) {
    await prisma.adminNotification.updateMany({ where: { id: { in: ids } }, data: { isRead: true } });
  }

  return NextResponse.json({ ok: true });
}
