"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

// ── Sign Up ────────────────────────────────────────────────
// Signature matches useActionState: (prevState, formData) => state

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const firstName = (formData.get("firstName") as string).trim();
  const lastName  = (formData.get("lastName")  as string).trim();
  const email     = (formData.get("email")      as string).trim();
  const password  = formData.get("password")    as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { firstName, lastName } },
  });

  if (error) return { error: error.message };

  // Profile row created automatically by Supabase trigger.
  redirect("/account");
}

// ── Sign In ────────────────────────────────────────────────

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email    = (formData.get("email")    as string).trim();
  const password = formData.get("password")  as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/account");
}

// ── Sign Out ───────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
