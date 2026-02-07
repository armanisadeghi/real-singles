# Complete Deployment System Documentation

## Overview

This project implements a powerful automated deployment system that manages everything from local development to production deployment via Vercel. The system provides:

1. **One-command deployment** via `pnpm ship`
2. **Automatic semantic version tracking** with database persistence
3. **Vercel integration** via webhooks for real-time deployment status
4. **Client-side update notifications** for users on stale versions
5. **Full admin portal** with deployment statistics and version history

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Scripts Reference](#scripts-reference)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Client Components](#client-components)
7. [GitHub Actions Workflow](#github-actions-workflow)
8. [Vercel Webhook Integration](#vercel-webhook-integration)
9. [File Reference](#file-reference)
10. [Environment Variables](#environment-variables)
11. [Replication Guide](#replication-guide)

---

## Quick Start

### Deploy Changes

```bash
# From project root - deploys web + mobile changes
pnpm ship "your commit message"           # Patch bump (1.3.10 → 1.3.11)
pnpm ship:minor "your commit message"     # Minor bump (1.3.10 → 1.4.0)
pnpm ship:major "your commit message"     # Major bump (1.3.10 → 2.0.0)
```

### What Happens

1. Version is incremented in the database
2. All changes are staged (`git add .`)
3. Commit is created with your message
4. Changes are pushed to remote
5. GitHub triggers Vercel deployment
6. Vercel webhook updates deployment status in database
7. Users see update banner when new version is available

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Developer                 GitHub                  Vercel              Database
      │                        │                      │                    │
      │  pnpm ship "msg"       │                      │                    │
      ├───────────────────────►│                      │                    │
      │                        │                      │                    │
      │  1. Update version     │                      │                    │
      ├────────────────────────┼──────────────────────┼───────────────────►│
      │     (status: pending)  │                      │                    │
      │                        │                      │                    │
      │  2. git add + commit   │                      │                    │
      ├───────────────────────►│                      │                    │
      │                        │                      │                    │
      │  3. git push           │                      │                    │
      ├───────────────────────►│                      │                    │
      │                        │                      │                    │
      │                        │  Trigger deployment  │                    │
      │                        ├─────────────────────►│                    │
      │                        │                      │                    │
      │                        │                      │  Webhook: building │
      │                        │                      ├───────────────────►│
      │                        │                      │                    │
      │                        │                      │  Webhook: ready    │
      │                        │                      ├───────────────────►│
      │                        │                      │                    │
      │                        │                      │                    │
  End Users                    │                      │                    │
      │                        │                      │                    │
      │  Polling /api/version  │                      │                    │
      ├────────────────────────┼──────────────────────┼────────────────────┤
      │                        │                      │                    │
      │  ◄─────────────────────┼──────────────────────┼────────────────────┤
      │  New version detected! │                      │                    │
      │  Show update banner    │                      │                    │
      │                        │                      │                    │
```

---

## Scripts Reference

### Root-Level Scripts (`/scripts/`)

#### `deploy.ts` - Main Deployment Script

**Location:** `/scripts/deploy.ts`

**Purpose:** All-in-one deployment command that orchestrates the entire deployment process from the monorepo root.

**Usage:**
```bash
pnpm ship "commit message"           # Patch version bump
pnpm ship:minor "commit message"     # Minor version bump
pnpm ship:major "commit message"     # Major version bump
```

**What it does:**
1. Validates commit message is provided
2. Checks if in a git repository
3. Checks for uncommitted changes
4. Runs the version update script (from `/web`)
5. Stages all changes (`git add .`)
6. Creates commit with escaped message
7. Pushes to remote

### Web-Level Scripts (`/web/scripts/`)

#### `update-app-version.ts` - Version Increment Script

**Location:** `/web/scripts/update-app-version.ts`

**Purpose:** Updates the `app_version` table in Supabase with new version information.

**Features:**
- Semantic versioning (major.minor.patch)
- Git commit hash tracking
- Commit message extraction
- Code change statistics (lines added/deleted, files changed)
- Duplicate prevention (checks if commit already has a version entry)

**Usage:**
```bash
pnpm version:update                    # Auto-increment patch
pnpm version:major                     # Increment major version
pnpm version:minor                     # Increment minor version
pnpm version:update --version=2.0.0    # Set specific version
```

#### `sync-vercel-deployments.ts` - Vercel Status Sync

**Location:** `/web/scripts/sync-vercel-deployments.ts`

**Purpose:** Manually syncs deployment statuses from Vercel API to the database.

**Usage:**
```bash
pnpm vercel:sync              # Sync pending deployments only
pnpm vercel:sync --all        # Sync all deployments (last 100)
```

#### `cleanup-duplicate-versions.ts` - Duplicate Cleanup

**Location:** `/web/scripts/cleanup-duplicate-versions.ts`

**Purpose:** Removes duplicate version entries that may have been created by bugs.

**Usage:**
```bash
pnpm cleanup:duplicates
```

#### `backfill-version-history.ts` - Historical Import

**Location:** `/web/scripts/backfill-version-history.ts`

**Purpose:** Imports git commit history into the app_version table for complete deployment history.

**Usage:**
```bash
pnpm backfill:history
```

---

## Database Schema

### `app_version` Table

```sql
CREATE TABLE app_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,                          -- Semantic version (e.g., "1.3.10")
    build_number INTEGER NOT NULL DEFAULT 1,        -- Auto-incrementing build number
    git_commit TEXT,                                -- Short git commit hash (7 chars)
    commit_message TEXT,                            -- Full commit message
    lines_added INTEGER,                            -- Lines of code added
    lines_deleted INTEGER,                          -- Lines of code deleted
    files_changed INTEGER,                          -- Number of files changed
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Deployment timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Record creation time
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Last update time
    
    -- Vercel integration fields (added by migration 00026)
    deployment_status TEXT DEFAULT 'pending',       -- pending, building, ready, error, canceled
    vercel_deployment_id TEXT,                      -- Vercel deployment UID
    vercel_deployment_url TEXT,                     -- Full deployment URL
    deployment_error TEXT                           -- Error message if deployment failed
);

-- Indexes for efficient lookups
CREATE INDEX idx_app_version_vercel_deployment_id ON app_version(vercel_deployment_id);
CREATE INDEX idx_app_version_git_commit ON app_version(git_commit);
```

### Deployment Status Values

| Status | Description |
|--------|-------------|
| `pending` | Version record created, deployment not started |
| `building` | Vercel is building the deployment |
| `ready` | Deployment successful, live in production |
| `error` | Deployment failed (check `deployment_error`) |
| `canceled` | Deployment was canceled |

### TypeScript Types

```typescript
interface AppVersion {
  id: string;
  version: string;
  build_number: number;
  git_commit: string | null;
  commit_message: string | null;
  lines_added: number | null;
  lines_deleted: number | null;
  files_changed: number | null;
  deployed_at: string;
  created_at: string;
  updated_at: string;
  deployment_status: string | null;
  vercel_deployment_id: string | null;
  vercel_deployment_url: string | null;
  deployment_error: string | null;
}
```

---

## API Endpoints

### GET `/api/version`

Returns the current deployed version.

**Response:**
```json
{
  "version": "1.3.42",
  "buildNumber": 142,
  "gitCommit": "a3f5c2d",
  "commitMessage": "feat: add new feature",
  "linesAdded": 150,
  "linesDeleted": 30,
  "filesChanged": 5,
  "deployedAt": "2026-02-06T10:30:00Z",
  "deploymentStatus": "ready",
  "vercelDeploymentUrl": "https://project-xyz.vercel.app",
  "deploymentError": null
}
```

**Location:** `/web/src/app/api/version/route.ts`

### GET `/api/version/history`

Returns paginated version history.

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "versions": [...],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

**Location:** `/web/src/app/api/version/history/route.ts`

### GET `/api/version/stats`

Returns deployment statistics.

**Response:**
```json
{
  "today": {
    "deployments": 5,
    "linesAdded": 500,
    "linesDeleted": 100,
    "filesChanged": 20
  },
  "week": {
    "deployments": 25,
    "linesAdded": 2500,
    "linesDeleted": 500,
    "filesChanged": 100
  },
  "month": {
    "deployments": 100,
    "linesAdded": 10000,
    "linesDeleted": 2000,
    "filesChanged": 400
  },
  "averageTimeBetweenDeployments": "2h",
  "totalDeployments": 142
}
```

**Location:** `/web/src/app/api/version/stats/route.ts`

### POST `/api/webhooks/vercel`

Receives Vercel deployment webhooks.

**Webhook Events:**
- `deployment.created` → status: `building`
- `deployment.succeeded` → status: `ready`
- `deployment.error` → status: `error`
- `deployment.canceled` → status: `canceled`

**Location:** `/web/src/app/api/webhooks/vercel/route.ts`

---

## Client Components

### `useAppVersion` Hook

**Location:** `/web/src/hooks/useAppVersion.ts`

**Purpose:** React hook for tracking app version and detecting updates.

**Usage:**
```typescript
import { useAppVersion } from "@/hooks/useAppVersion";

const {
  currentVersion,          // Initial version when hook mounted
  latestVersion,           // Most recent version from API
  isUpdateAvailable,       // True when new version detected
  isChecking,              // True while fetching version
  error,                   // Error message if fetch failed
  checkForUpdate,          // Function to manually trigger check
  dismissUpdate,           // Function to dismiss update notification
  reloadApp,               // Function to perform hard reload
} = useAppVersion({
  pollingInterval: 300000,    // Check every 5 minutes (default)
  checkOnRouteChange: true,   // Check on navigation (default)
  debug: false,               // Enable console logging
  onUpdateAvailable: (newVer, oldVer) => {
    console.log(`Update: ${oldVer.version} → ${newVer.version}`);
  },
});
```

**Features:**
- Configurable polling interval
- Route change detection
- Build number comparison (more reliable than version strings)
- Session-based dismissal
- Hard reload with cache clearing

### `UpdateBanner` Component

**Location:** `/web/src/components/UpdateBanner.tsx`

**Purpose:** Non-intrusive banner shown when updates are available.

**Usage:**
```tsx
import { UpdateBanner } from "@/components/UpdateBanner";

// In your layout
<UpdateBanner 
  pollingInterval={300000}    // 5 minutes
  checkOnRouteChange={true}
  position="top"              // or "bottom"
/>
```

**Features:**
- Reload button with loading state
- Dismiss button (per session)
- Responsive design
- Accessible (ARIA labels)

### Integration in Layout

**Location:** `/web/src/app/(app)/layout.tsx`

```tsx
import { UpdateBanner } from "@/components/UpdateBanner";

export default async function AppLayout({ children }) {
  return (
    <div>
      {/* Update Banner - Shown when new version is available */}
      <UpdateBanner 
        pollingInterval={300000} 
        checkOnRouteChange={true}
      />
      
      {/* Rest of layout */}
      {children}
    </div>
  );
}
```

---

## GitHub Actions Workflow

**Location:** `/.github/workflows/update-version.yml`

**Trigger:** Push to `main` branch (excluding docs, markdown, .github)

**Purpose:** Automatically increments patch version after each deployment.

```yaml
name: Update App Version

on:
  push:
    branches:
      - main
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - '.github/**'

concurrency:
  group: version-update
  cancel-in-progress: false

jobs:
  update-version:
    name: Update Version in Database
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./web
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          cache-dependency-path: './web/pnpm-lock.yaml'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Update app version
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: pnpm version:update
```

**Required GitHub Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Vercel Webhook Integration

### Setup Instructions

1. **Get your webhook URL:**
   ```
   https://YOUR_DOMAIN.com/api/webhooks/vercel
   ```

2. **Configure in Vercel:**
   - Go to Project Settings → Webhooks
   - Add webhook with these events:
     - ✅ `deployment.created`
     - ✅ `deployment.succeeded`
     - ✅ `deployment.error`
     - ✅ `deployment.canceled`

3. **Optional: Add webhook secret:**
   ```env
   VERCEL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Vercel Sync Service

**Location:** `/web/src/lib/services/vercel-sync.ts`

**Purpose:** Fallback sync mechanism that runs on API calls in case webhooks miss events.

```typescript
import { syncPendingDeployments } from "@/lib/services/vercel-sync";

// Called automatically by /api/version and /api/version/history
await syncPendingDeployments();
```

---

## Admin Portal

**Location:** `/web/src/app/admin/(dashboard)/settings/app-version/page.tsx`

**URL:** `/admin/settings/app-version`

**Features:**
- Large current version display with build number
- Deployment statistics (today, week, month)
- Lines added/deleted and files changed
- Version history table with pagination
- Deployment status badges (Pending, Building, Deployed, Failed)
- Direct links to Vercel deployments
- Real-time refresh capability

---

## File Reference

### Complete File List

```
📁 Project Root
├── 📁 scripts/
│   └── deploy.ts                              # Root-level deploy script
├── 📁 .github/workflows/
│   └── update-version.yml                     # GitHub Actions workflow
└── 📁 web/
    ├── package.json                           # Contains ship scripts
    ├── 📁 scripts/
    │   ├── deploy.ts                          # Web-specific deploy script
    │   ├── update-app-version.ts              # Version increment script
    │   ├── sync-vercel-deployments.ts         # Vercel sync script
    │   ├── cleanup-duplicate-versions.ts      # Cleanup script
    │   ├── backfill-version-history.ts        # History backfill script
    │   └── VERSION_TRACKING.md                # Detailed documentation
    ├── 📁 src/
    │   ├── 📁 app/
    │   │   ├── 📁 (app)/
    │   │   │   └── layout.tsx                 # Includes UpdateBanner
    │   │   ├── 📁 api/
    │   │   │   ├── 📁 version/
    │   │   │   │   ├── route.ts               # GET /api/version
    │   │   │   │   ├── 📁 history/
    │   │   │   │   │   └── route.ts           # GET /api/version/history
    │   │   │   │   └── 📁 stats/
    │   │   │   │       └── route.ts           # GET /api/version/stats
    │   │   │   └── 📁 webhooks/
    │   │   │       └── 📁 vercel/
    │   │   │           └── route.ts           # POST /api/webhooks/vercel
    │   │   └── 📁 admin/(dashboard)/settings/
    │   │       └── 📁 app-version/
    │   │           └── page.tsx               # Admin version page
    │   ├── 📁 components/
    │   │   └── UpdateBanner.tsx               # Update notification banner
    │   ├── 📁 hooks/
    │   │   └── useAppVersion.ts               # Version tracking hook
    │   └── 📁 lib/
    │       ├── 📁 services/
    │       │   └── vercel-sync.ts             # Vercel sync service
    │       └── 📁 supabase/
    │           └── admin.ts                   # Admin Supabase client
    ├── 📁 supabase/migrations/
    │   └── 00026_add_deployment_status.sql    # Deployment status columns
    ├── SETUP_VERSION_TRACKING.md              # Setup guide
    ├── VERSION_TRACKING_SUMMARY.md            # Implementation summary
    └── VERCEL_WEBHOOK_SETUP.md                # Webhook setup guide
```

---

## Environment Variables

### Required for Scripts

```env
# .env.local (web directory)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Required for Vercel Sync

```env
# Only needed for manual sync (vercel:sync command)
VERCEL_ACCESS_TOKEN=your-vercel-token
VERCEL_PROJECT_ID=your-project-id
VERCEL_TEAM_ID=your-team-id  # Optional, for team projects
```

### Optional for Webhook Security

```env
VERCEL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### GitHub Secrets (for Actions)

| Secret Name | Description |
|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (write access) |

---

## Replication Guide

To replicate this system in another project:

### Step 1: Database Setup

Run this migration in Supabase:

```sql
-- Create app_version table
CREATE TABLE IF NOT EXISTS public.app_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    build_number INTEGER NOT NULL DEFAULT 1,
    git_commit TEXT,
    commit_message TEXT,
    lines_added INTEGER,
    lines_deleted INTEGER,
    files_changed INTEGER,
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deployment_status TEXT DEFAULT 'pending',
    vercel_deployment_id TEXT,
    vercel_deployment_url TEXT,
    deployment_error TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_version_vercel_deployment_id 
ON app_version(vercel_deployment_id);

CREATE INDEX IF NOT EXISTS idx_app_version_git_commit 
ON app_version(git_commit);

-- RLS Policies (adjust based on your needs)
ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "app_version_read" ON app_version
    FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "app_version_write" ON app_version
    FOR ALL USING (auth.role() = 'service_role');

-- Insert initial version
INSERT INTO app_version (version, build_number)
VALUES ('1.0.0', 1);
```

### Step 2: Copy Core Files

1. **Scripts** (`/web/scripts/`):
   - `update-app-version.ts`
   - `deploy.ts`
   
2. **API Routes** (`/web/src/app/api/`):
   - `version/route.ts`
   - `version/history/route.ts`
   - `version/stats/route.ts`
   - `webhooks/vercel/route.ts`

3. **Client Components** (`/web/src/`):
   - `hooks/useAppVersion.ts`
   - `components/UpdateBanner.tsx`

4. **Services** (`/web/src/lib/`):
   - `services/vercel-sync.ts`
   - `supabase/admin.ts`

5. **GitHub Actions** (`/.github/workflows/`):
   - `update-version.yml`

### Step 3: Configure package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "ship": "tsx scripts/deploy.ts",
    "ship:minor": "tsx scripts/deploy.ts --minor",
    "ship:major": "tsx scripts/deploy.ts --major",
    "version:update": "tsx scripts/update-app-version.ts",
    "version:minor": "tsx scripts/update-app-version.ts --minor",
    "version:major": "tsx scripts/update-app-version.ts --major",
    "vercel:sync": "tsx scripts/sync-vercel-deployments.ts",
    "vercel:sync:all": "tsx scripts/sync-vercel-deployments.ts --all",
    "cleanup:duplicates": "tsx scripts/cleanup-duplicate-versions.ts",
    "backfill:history": "tsx scripts/backfill-version-history.ts"
  }
}
```

### Step 4: Add Dependencies

```bash
pnpm add -D tsx dotenv
```

### Step 5: Environment Configuration

1. Create `.env.local` with Supabase credentials
2. Add GitHub secrets for Actions
3. Configure Vercel webhook
4. Optional: Add Vercel API credentials for manual sync

### Step 6: Add UpdateBanner to Layout

```tsx
import { UpdateBanner } from "@/components/UpdateBanner";

export default function Layout({ children }) {
  return (
    <>
      <UpdateBanner />
      {children}
    </>
  );
}
```

### Step 7: Regenerate Database Types

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

---

## Troubleshooting

### Version not incrementing

1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure script has database write access

### Banner not appearing

1. Check browser console for errors
2. Verify `/api/version` returns data
3. Check that `UpdateBanner` is in layout
4. Try manually updating version

### Webhook not updating status

1. Check Vercel webhook logs
2. Verify webhook URL is correct
3. Check application logs for errors
4. Try manual sync: `pnpm vercel:sync`

### Duplicate version entries

1. Run cleanup: `pnpm cleanup:duplicates`
2. The update script now prevents duplicates automatically

---

## Best Practices

1. **Let automation handle it** - The system auto-increments patch versions
2. **Use semantic versioning** - Manual bumps for features (minor) and breaking changes (major)
3. **Don't spam updates** - Users see banner once per version
4. **Monitor actions** - Check GitHub Actions logs regularly
5. **Keep secrets secure** - Never commit `.env.local`

---

*Last updated: 2026-02-06*
*System version: Documented from production implementation*
