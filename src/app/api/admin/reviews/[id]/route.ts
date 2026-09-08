import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { awardReviewPoints } from "@/lib/data/loyalty";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    const allowed = ["PENDING", "PUBLISHED", "REJECTED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await prisma.productReview.update({
      where: { id },
      data:  { status },
      select: { profileId: true, status: true },
    });

    // Award review points when publishing for the first time
    if (status === "PUBLISHED") {
      try { await awardReviewPoints(review.profileId); } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reviews PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
