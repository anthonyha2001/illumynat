import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/addresses/[id] — update or set default
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.address.findUnique({ where: { id }, select: { profileId: true } });
    if (!existing || existing.profileId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { profileId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        label:        body.label        ?? undefined,
        firstName:    body.firstName    ?? undefined,
        lastName:     body.lastName     ?? undefined,
        addressLine1: body.addressLine1 ?? undefined,
        addressLine2: body.addressLine2 ?? undefined,
        city:         body.city         ?? undefined,
        state:        body.state        ?? undefined,
        zipCode:      body.zipCode      ?? undefined,
        country:      body.country      ?? undefined,
        isDefault:    body.isDefault    ?? undefined,
      },
    });

    return NextResponse.json({ address });
  } catch (err) {
    console.error("[addresses PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/addresses/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.address.findUnique({
      where: { id },
      select: { profileId: true, isDefault: true },
    });
    if (!existing || existing.profileId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, promote the oldest remaining to default
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { profileId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) {
        await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[addresses DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
