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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, profileId, broadcast } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  if (broadcast) {
    // Send to all CUSTOMER profiles
    const customers = await prisma.profile.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true },
    });

    await prisma.customerNotification.createMany({
      data: customers.map((c) => ({ profileId: c.id, title, body })),
    });

    return NextResponse.json({ sent: customers.length });
  }

  if (!profileId) {
    return NextResponse.json({ error: "profileId or broadcast required" }, { status: 400 });
  }

  await prisma.customerNotification.create({
    data: { profileId, title, body },
  });

  return NextResponse.json({ ok: true });
}
