#!/usr/bin/env tsx
/**
 * Set Test User Password Script
 *
 * Sets a test user's password to the admin password so you can log in as them.
 * This is useful for testing the matching algorithm, liking users, etc.
 *
 * Admin User: admin@realsingles.com
 * Admin Password: AdminPass123!
 * 
 * Test User: kayla.lee18@testuser.realsingles.com
 * Test Password: TestPassword123!

 * Usage:
 *   # By user ID
 *   pnpm tsx scripts/set-test-user-password.ts d69593d2-8091-4742-ae4d-c2fcafa83714
 *
 *   # By email
 *   pnpm tsx scripts/set-test-user-password.ts kayla.lee18@testuser.realsingles.com
 *
 *   # With custom password
 *   pnpm tsx scripts/set-test-user-password.ts d69593d2-8091-4742-ae4d-c2fcafa83714 MyCustomPass123!
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - REAL_SINGLES_ADMIN_PASSWORD in .env.local (optional, defaults to AdminPass123!)
 *
 * Safety:
 *   - Only works on test users (@testuser.realsingles.com emails)
 *   - Won't modify real user accounts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const defaultPassword = process.env.REAL_SINGLES_ADMIN_PASSWORD || "AdminPass123!";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user email domain - only these users can have their password changed
const TEST_USER_DOMAIN = "@testuser.realsingles.com";

// UUID regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getUserById(userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    return { user: null, error };
  }
  return { user: data.user, error: null };
}

async function getUserByEmail(email: string) {
  // List users and find by email
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    return { user: null, error };
  }

  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { user: null, error: new Error(`User with email ${email} not found`) };
  }
  return { user, error: null };
}

async function setUserPassword(userId: string, newPassword: string) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  return { user: data?.user, error };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📋 Set Test User Password

Usage:
  pnpm tsx scripts/set-test-user-password.ts <user-id-or-email> [password]

Arguments:
  user-id-or-email   User ID (UUID) or email address
  password           Optional. Defaults to REAL_SINGLES_ADMIN_PASSWORD or AdminPass123!

Examples:
  # By user ID
  pnpm tsx scripts/set-test-user-password.ts d69593d2-8091-4742-ae4d-c2fcafa83714

  # By email
  pnpm tsx scripts/set-test-user-password.ts kayla.lee18@testuser.realsingles.com

  # With custom password
  pnpm tsx scripts/set-test-user-password.ts d69593d2-8091-4742-ae4d-c2fcafa83714 MyPass123!

Safety:
  ⚠️  Only works on test users (${TEST_USER_DOMAIN} emails)
`);
    process.exit(0);
  }

  const identifier = args[0];
  const newPassword = args[1] || defaultPassword;

  console.log("\n🔐 Set Test User Password\n");
  console.log(`   Identifier: ${identifier}`);
  console.log(`   Password will be set to: ${newPassword}\n`);

  // Determine if input is UUID or email
  const isUuid = UUID_REGEX.test(identifier);
  let user;

  if (isUuid) {
    console.log("   Looking up user by ID...");
    const result = await getUserById(identifier);
    if (result.error) {
      console.error(`\n❌ Error finding user: ${result.error.message}`);
      process.exit(1);
    }
    user = result.user;
  } else {
    console.log("   Looking up user by email...");
    const result = await getUserByEmail(identifier);
    if (result.error) {
      console.error(`\n❌ Error finding user: ${result.error.message}`);
      process.exit(1);
    }
    user = result.user;
  }

  if (!user) {
    console.error("\n❌ User not found");
    process.exit(1);
  }

  console.log(`\n   Found user:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Created: ${user.created_at}`);

  // Safety check: Only allow test users
  if (!user.email?.endsWith(TEST_USER_DOMAIN)) {
    console.error(`\n❌ Safety check failed!`);
    console.error(`   This user's email (${user.email}) does not end with ${TEST_USER_DOMAIN}`);
    console.error(`   This script only works on test user accounts for safety.`);
    console.error(`\n   If you need to reset a real user's password, use the Supabase dashboard.`);
    process.exit(1);
  }

  // Update password
  console.log(`\n   Updating password...`);

  const { error: updateError } = await setUserPassword(user.id, newPassword);

  if (updateError) {
    console.error(`\n❌ Error updating password: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`\n✅ Password updated successfully!`);
  console.log(`\n   You can now log in as:`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Password: ${newPassword}`);
  console.log(`\n   Login URL: https://real-singles.vercel.app/login`);
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
