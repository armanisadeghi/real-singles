#!/usr/bin/env tsx
/**
 * Database Migration Script
 * 
 * This script safely pushes Supabase migrations and regenerates TypeScript types.
 * 
 * Features:
 * - Shows pending migrations before applying
 * - Requires confirmation before destructive operations
 * - Automatically regenerates TypeScript types after successful migration
 * - Safe by default - won't modify anything without explicit confirmation
 * 
 * Usage:
 *   pnpm db:migrate              # Interactive mode - shows pending, asks for confirmation
 *   pnpm db:migrate --dry-run    # Only show what would be done, no changes
 *   pnpm db:migrate --yes        # Auto-confirm (for CI/CD, use with caution)
 *   pnpm db:migrate --types-only # Only regenerate types, no migration
 */

import { execSync, spawnSync } from 'child_process';
import * as readline from 'readline';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const autoConfirm = args.includes('--yes') || args.includes('-y');
const typesOnly = args.includes('--types-only');

function run(cmd: string, options?: { silent?: boolean }): string {
  try {
    const result = execSync(cmd, { 
      encoding: 'utf8',
      stdio: options?.silent ? 'pipe' : 'inherit'
    });
    return result || '';
  } catch (error: any) {
    if (error.stdout) return error.stdout;
    throw error;
  }
}

function runWithOutput(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error: any) {
    if (error.stdout) return error.stdout;
    if (error.stderr) return error.stderr;
    throw error;
  }
}

async function confirm(message: string): Promise<boolean> {
  if (autoConfirm) {
    console.log(`${message} (auto-confirmed with --yes)`);
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

function generateTypes(): boolean {
  console.log('\n📝 Generating TypeScript types...');
  try {
    execSync('npx supabase gen types typescript --linked > src/types/database.types.ts', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ TypeScript types generated successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to generate types:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 RealSingles Database Migration Tool\n');

  // Types-only mode
  if (typesOnly) {
    console.log('Running in types-only mode...');
    const success = generateTypes();
    process.exit(success ? 0 : 1);
  }

  // Check migration status
  console.log('📋 Checking migration status...\n');
  
  let migrationOutput: string;
  try {
    migrationOutput = runWithOutput('npx supabase migration list');
  } catch (error: any) {
    console.error('❌ Failed to check migration status:', error.message);
    process.exit(1);
  }

  console.log(migrationOutput);

  // Parse output to find pending migrations
  const lines = migrationOutput.split('\n');
  const pendingMigrations: string[] = [];
  
  for (const line of lines) {
    // Look for lines where Remote column is empty (local-only migrations)
    const match = line.match(/^\s*(\d+)\s*\|\s*\|\s*\d+/);
    if (match) {
      pendingMigrations.push(match[1]);
    }
  }

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations are up to date!\n');
    
    // Offer to regenerate types anyway
    if (await confirm('Would you like to regenerate TypeScript types anyway?')) {
      generateTypes();
    }
    return;
  }

  console.log(`\n📦 Found ${pendingMigrations.length} pending migration(s): ${pendingMigrations.join(', ')}\n`);

  if (isDryRun) {
    console.log('🔍 Dry run mode - no changes will be made');
    console.log('\nTo apply these migrations, run: pnpm db:migrate');
    return;
  }

  // Confirm before applying
  if (!await confirm('Do you want to apply these migrations?')) {
    console.log('Aborted.');
    return;
  }

  // Push migrations
  console.log('\n🚀 Pushing migrations...\n');
  
  try {
    // Use spawn to handle interactive prompt
    const result = spawnSync('npx', ['supabase', 'db', 'push'], {
      stdio: 'inherit',
      input: 'Y\n',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error('\n❌ Migration failed');
      process.exit(1);
    }

    console.log('\n✅ Migrations applied successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  // Generate types after successful migration
  generateTypes();

  console.log('\n🎉 Done! Database is up to date.');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
