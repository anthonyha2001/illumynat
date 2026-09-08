import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { firstName, lastName, phone } = await req.json();

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone:     phone?.trim() || null,
      },
      select: { firstName: true, lastName: true, phone: true },
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[account/profile PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
