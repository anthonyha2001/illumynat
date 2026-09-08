import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { setPromoZone } from "@/lib/data/siteContent";
import type { PromoZoneContent } from "@/lib/data/siteContent";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: PromoZoneContent = await req.json();
  await setPromoZone(body);
  return NextResponse.json({ ok: true });
}
