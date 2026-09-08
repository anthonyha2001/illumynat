import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const BUCKET = "product-images";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  return profile?.role === "ADMIN" ? user : null;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    // Sanitize filename and make it unique
    const ext       = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName  = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path      = `${Date.now()}-${safeName}`;

    const service = createServiceClient();
    const { data, error } = await service.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("[admin/upload] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token:     data.token,
      path,
      publicUrl,
    });
  } catch (err) {
    console.error("[admin/upload]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
