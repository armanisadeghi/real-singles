/**
 * Fix RLS Policy Script
 * Applies the RLS fix for user discovery
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🔧 Fixing RLS policy for user discovery...\n");

  // First, drop the old restrictive policy
  console.log("1. Dropping old restrictive policy...");
  const { error: dropError } = await supabase.rpc("exec_sql", {
    sql: `DROP POLICY IF EXISTS "Users can read own data" ON users;`,
  });
  
  if (dropError) {
    // If exec_sql RPC doesn't exist, we need another approach
    console.log("   Note: exec_sql RPC not available, trying direct approach...");
    
    // Try using the REST API to check current policies
    const { data: policies, error: policyError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "users");
    
    if (policyError) {
      console.log("   Cannot query policies directly. Please run the following SQL in Supabase Dashboard > SQL Editor:");
      console.log("\n" + "=".repeat(60));
      console.log(`
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Add policy to allow authenticated users to read user status for discovery
CREATE POLICY "Authenticated users can read user status for discovery" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    status = 'active'
  );
`);
      console.log("=".repeat(60) + "\n");
      return;
    }
  }

  // If we got here, try creating the new policy
  console.log("2. Creating new discovery-friendly policy...");
  const { error: createError } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE POLICY "Authenticated users can read user status for discovery" ON users
        FOR SELECT
        TO authenticated
        USING (
          auth.uid() = id
          OR
          status = 'active'
        );
    `,
  });

  if (createError) {
    console.log("   Error creating policy:", createError.message);
  } else {
    console.log("   ✓ Policy created successfully!");
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
