import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, topic, body } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const thread = await prisma.contactThread.create({
      data: {
        profileId:  user?.id ?? null,
        guestName:  user ? null : (name?.trim() || null),
        guestEmail: user ? null : (email?.trim() || null),
        subject:    subject.trim(),
        topic:      topic?.trim() || null,
        messages: {
          create: { body: body.trim(), fromAdmin: false },
        },
      },
      select: { id: true },
    });

    // Notify admin
    const senderName = user
      ? (await prisma.profile.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } }))
      : null;
    const displayName = senderName
      ? `${senderName.firstName} ${senderName.lastName}`
      : (name?.trim() || email?.trim() || "Guest");

    await prisma.adminNotification.create({
      data: {
        type:  "NEW_MESSAGE",
        title: `New message — ${subject.trim()}`,
        body:  `${displayName} sent you a message: "${body.trim().slice(0, 80)}${body.trim().length > 80 ? "…" : ""}"`,
        metadata: { threadId: thread.id, from: displayName },
      },
    });

    return NextResponse.json({ threadId: thread.id });
  } catch (err) {
    console.error("[contact POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
