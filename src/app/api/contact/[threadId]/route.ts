import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

// GET — fetch thread + messages (admin or owner)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const thread = await prisma.contactThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      profile:  { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access check: admin OR owner
  const isAdmin = user ? (await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } }))?.role === "ADMIN" : false;
  const isOwner = user && thread.profileId === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mark customer messages as read if admin is fetching
  if (isAdmin) {
    await prisma.contactMessage.updateMany({
      where: { threadId, fromAdmin: false, readAt: null },
      data:  { readAt: new Date() },
    });
  }

  return NextResponse.json({ thread });
}

// POST — send a message (admin or customer)
export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const { body } = await req.json();

  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const thread = await prisma.contactThread.findUnique({
    where: { id: threadId },
    select: { id: true, profileId: true, status: true, subject: true, guestName: true, guestEmail: true },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (thread.status === "CLOSED") return NextResponse.json({ error: "Thread is closed" }, { status: 400 });

  const isAdmin = user ? (await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } }))?.role === "ADMIN" : false;
  const isOwner = user && thread.profileId === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const message = await prisma.contactMessage.create({
    data: { threadId, body: body.trim(), fromAdmin: !!isAdmin },
  });

  // Update thread timestamp
  await prisma.contactThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  // Notify the other party
  if (isAdmin && thread.profileId) {
    await prisma.customerNotification.create({
      data: {
        profileId: thread.profileId,
        title: `New reply on: ${thread.subject}`,
        body:  body.trim().slice(0, 120),
        metadata: { threadId, href: `/account/messages/${threadId}` },
      },
    });
  } else if (!isAdmin) {
    await prisma.adminNotification.create({
      data: {
        type:  "NEW_MESSAGE",
        title: `Reply in thread: ${thread.subject}`,
        body:  body.trim().slice(0, 120),
        metadata: { threadId },
      },
    });
  }

  return NextResponse.json({ message });
}

// PATCH — close/reopen thread (admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  const thread = await prisma.contactThread.update({
    where: { id: threadId },
    data:  { status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ thread });
}
