import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { adjustPoints } from "@/lib/data/loyalty";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { profileId, points, description } = await req.json();
  if (!profileId || typeof points !== "number" || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await adjustPoints(profileId, points, `Admin: ${description}`);
  return NextResponse.json({ ok: true });
}
