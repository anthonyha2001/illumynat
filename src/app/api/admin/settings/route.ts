import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "@/lib/data/settings";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await updateSettings(body);
  return NextResponse.json({ ok: true });
}
