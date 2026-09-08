import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { setScentFamilies } from "@/lib/data/siteContent";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { families } = await req.json();
    if (!Array.isArray(families)) {
      return NextResponse.json({ error: "families must be an array" }, { status: 400 });
    }

    const cleaned = families
      .map((f: unknown) => (typeof f === "string" ? f.trim() : ""))
      .filter(Boolean);

    await setScentFamilies(cleaned);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[scent-families PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
