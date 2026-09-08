import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { setHeroContent } from "@/lib/data/siteContent";
import type { HeroContent } from "@/lib/data/siteContent";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: HeroContent = await req.json();
  await setHeroContent(body);
  return NextResponse.json({ ok: true });
}
