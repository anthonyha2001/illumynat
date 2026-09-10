import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await prisma.adminNotification.create({
      data: {
        type: "NEWSLETTER_SIGNUP",
        title: "New newsletter subscriber",
        body: `${email} joined the ILLUMYNAT Circle.`,
        metadata: { email },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
