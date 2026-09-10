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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path = `${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const service = createServiceClient();
    const { error } = await service.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("[admin/upload] Supabase error:", error);
      return NextResponse.json({ error: error.message ?? "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = service.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (err) {
    console.error("[admin/upload]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
