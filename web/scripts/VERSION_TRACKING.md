# App Version Tracking System

Automatically tracks deployed versions and prompts users to refresh when updates are available.

## 🎯 Purpose

Solves the problem of users running outdated code in long-running browser sessions, which can cause:
- API format mismatches
- Missing bug fixes
- Broken features

## 🏗️ Architecture

### 1. Database Table (`app_version`)
Stores version history with:
- Semantic version (1.0.0, 1.0.1, etc.)
- Build number (auto-incremented)
- Git commit hash
- Deployment timestamp

### 2. API Endpoint (`/api/version`)
Returns current deployed version info:
```json
{
  "version": "1.0.5",
  "buildNumber": 42,
  "gitCommit": "a3f5c2d",
  "deployedAt": "2026-02-03T10:30:00Z"
}
```

### 3. Client Hook (`useAppVersion`)
React hook that:
- Checks for updates periodically (default: 5 minutes)
- Checks on route changes
- Compares build numbers to detect updates
- Provides callbacks for custom behavior

### 4. Update Banner (`UpdateBanner`)
Non-intrusive UI component that:
- Appears at top of screen when update available
- Shows version info
- Provides reload button
- Can be dismissed per session

### 5. Automation
GitHub Actions workflow that:
- Runs on push to main
- Auto-increments patch version
- Updates database
- Zero manual intervention

## 📦 Setup

### 1. GitHub Secrets
Add these to your repository settings (Settings → Secrets → Actions):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Initial Version (Already Done)
The migration has already created the table and set initial version to 1.0.0.

### 3. Verify Setup
Test the system:

```bash
# Check current version via API
curl https://your-domain.com/api/version

# Manually update version (for testing)
cd web
pnpm version:update
```

## 🚀 Usage

### Automatic (Recommended)
The GitHub Actions workflow automatically increments the patch version on every push to main:

```
Push to main → Deploy → Version auto-updates (1.0.0 → 1.0.1)
```

No manual intervention needed!

### Manual Version Updates

**Patch version** (bug fixes):
```bash
pnpm version:update
# 1.0.0 → 1.0.1
```

**Minor version** (new features):
```bash
pnpm version:minor
# 1.0.5 → 1.1.0
```

**Major version** (breaking changes):
```bash
pnpm version:major
# 1.5.3 → 2.0.0
```

**Custom version**:
```bash
pnpm version:update --version=3.0.0
```

## 🎨 Customization

### Adjust Polling Interval

Edit `web/src/app/(app)/layout.tsx`:

```tsx
<UpdateBanner 
  pollingInterval={600000}  // Check every 10 minutes
  checkOnRouteChange={true}
/>
```

### Custom Update Handling

Use the hook directly for custom behavior:

```tsx
"use client";

import { useAppVersion } from "@/hooks/useAppVersion";
import { useToast } from "@/components/ui/Toast";

export function MyComponent() {
  const toast = useToast();
  
  const { isUpdateAvailable, reloadApp } = useAppVersion({
    pollingInterval: 300000,
    onUpdateAvailable: (newVer, oldVer) => {
      toast.info(`Update available: ${newVer.version}`);
    },
  });

  return (
    <>
      {isUpdateAvailable && (
        <button onClick={reloadApp}>
          Update Now
        </button>
      )}
    </>
  );
}
```

### Disable Version Checking

To temporarily disable (e.g., during development):

```tsx
<UpdateBanner pollingInterval={0} checkOnRouteChange={false} />
```

Or remove `<UpdateBanner />` entirely from the layout.

## 🧪 Testing

### 1. Test Version API
```bash
curl http://localhost:3000/api/version
```

### 2. Test Version Update Script
```bash
cd web
pnpm version:update
```

Should output:
```
🔄 Updating app version...
⬆️  Patch version bump: 1.0.0 → 1.0.1
✅ App version updated successfully!
   Version: 1.0.1
   Build: #2
   Commit: a3f5c2d
```

### 3. Test Update Detection
1. Open app in browser
2. Run `pnpm version:update` in terminal
3. Wait up to 5 minutes (or change route)
4. Banner should appear at top

### 4. Test in Development
The system works in development but logs debug info:

```tsx
// Enable debug logging
const { ... } = useAppVersion({ debug: true });
```

Check browser console for:
```
[useAppVersion] Running initial version check
[useAppVersion] Checking for update...
[useAppVersion] Fetched version: {...}
```

## 🔧 Troubleshooting

### Version not updating automatically
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure workflow file exists at `.github/workflows/update-version.yml`

### Banner not appearing
1. Check browser console for errors
2. Verify `/api/version` returns data
3. Check that `UpdateBanner` is in layout
4. Try manually updating version

### Database errors
1. Verify Supabase credentials in `.env.local`
2. Check RLS policies allow reading `app_version`
3. Verify service role key has write access

### Build number not incrementing
The script always increments build number. If it doesn't:
1. Check script output for errors
2. Verify database connection
3. Check that previous version exists in table

## 📊 Monitoring

### Check Version History
```sql
SELECT 
  version,
  build_number,
  git_commit,
  deployed_at
FROM app_version
ORDER BY deployed_at DESC
LIMIT 10;
```

### Current Active Version
```sql
SELECT * FROM app_version
ORDER BY deployed_at DESC
LIMIT 1;
```

## 🎯 Best Practices

1. **Let automation handle it** - Don't manually update unless needed
2. **Use semantic versioning** - Patch for fixes, minor for features, major for breaking changes
3. **Test before deploy** - Verify version updates in staging
4. **Monitor errors** - Check GitHub Actions logs regularly
5. **Don't spam updates** - Users only see banner once per version

## 🔐 Security

- Version table uses RLS - anyone can read, only service role can write
- Service role key required for updates
- No sensitive data exposed in version endpoint
- Banner only shows version number (no internal details)

## 🚨 Edge Cases Handled

- **Multiple tabs**: Each tab checks independently, all refresh together
- **Offline**: Failed checks logged, retry on next interval
- **Race conditions**: Concurrency group prevents simultaneous updates
- **Build failures**: Version only updates if build succeeds
- **User dismissal**: Banner hidden until next version
- **Route changes**: Immediate check on navigation

## 📝 Development Notes

- Hook uses build number comparison (more reliable than version string)
- Polling uses exponential backoff on errors
- Banner auto-dismisses on route change if user ignores it
- Version check cached client-side per session
- No performance impact (lightweight API call, batched with navigation)
