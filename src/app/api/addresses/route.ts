import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/addresses — create new address
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, firstName, lastName, addressLine1, addressLine2, city, state, zipCode, country, isDefault } = body;

    if (!firstName || !lastName || !addressLine1 || !city || !state || !zipCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If new address is default, unset all others first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { profileId: user.id },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default automatically
    const count = await prisma.address.count({ where: { profileId: user.id } });

    const address = await prisma.address.create({
      data: {
        profileId: user.id,
        label: label || null,
        firstName,
        lastName,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        zipCode,
        country: country || "US",
        isDefault: isDefault || count === 0,
      },
    });

    return NextResponse.json({ address });
  } catch (err) {
    console.error("[addresses POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
