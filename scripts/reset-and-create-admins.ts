/**
 * reset-and-create-admins.ts
 * --------------------------
 * 1. Wipes every Prisma-managed table (respecting FK order)
 * 2. Deletes all Supabase Auth users
 * 3. Creates two admin accounts with confirmed emails
 *
 * Run: npx tsx scripts/reset-and-create-admins.ts
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Step 1: wipe all application tables ──────────────────
async function clearDatabase() {
  console.log("🗑  Clearing database...");

  // Fetch all user tables then truncate them all with CASCADE
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
  );

  if (tables.length > 0) {
    const names = tables.map((t) => `"${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE`);
  }

  console.log(`✓ Truncated ${tables.length} tables`);
}

// ── Step 2: delete all Supabase Auth users ───────────────
async function clearAuthUsers() {
  console.log("🗑  Clearing Supabase auth users...");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  for (const user of data.users) {
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delError) console.warn(`  ⚠ Could not delete ${user.email}: ${delError.message}`);
  }

  console.log(`✓ Deleted ${data.users.length} auth user(s)`);
}

// ── Step 3: create admin accounts ────────────────────────
const ADMINS = [
  { email: "anthonyhasrouny8@gmail.com", password: "123Soleil@1",  name: "Anthony Hasrouny" },
  { email: "saade0977@gmail.com",        password: "123Saadeh@1",  name: "Saade"            },
];

async function createAdmins() {
  console.log("👤 Creating admin users...");

  for (const admin of ADMINS) {
    // Create in Supabase Auth (email pre-confirmed)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email:            admin.email,
      password:         admin.password,
      email_confirm:    true,
    });

    if (error) {
      console.error(`  ✗ Failed to create ${admin.email}: ${error.message}`);
      continue;
    }

    const userId = data.user.id;

    // The Supabase trigger creates a Profile row automatically,
    // but it may take a moment — upsert to be safe
    const [firstName, ...rest] = admin.name.split(" ");
    await prisma.profile.upsert({
      where:  { id: userId },
      update: { role: "ADMIN" },
      create: {
        id:        userId,
        email:     admin.email,
        firstName: firstName,
        lastName:  rest.join(" ") || "",
        role:      "ADMIN",
      },
    });

    console.log(`  ✓ ${admin.email} — ADMIN`);
  }
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  try {
    await clearDatabase();
    await clearAuthUsers();
    await createAdmins();
    console.log("\n✅ Done — database reset and admin accounts created.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
