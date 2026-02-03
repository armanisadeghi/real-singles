# Version Tracking Setup Guide

Quick start guide for setting up the automatic version tracking system.

## ✅ What's Already Done

The system is already implemented and ready to use:

- [x] Database table (`app_version`) created
- [x] API endpoint (`/api/version`) implemented
- [x] Client hook (`useAppVersion`) created
- [x] Update banner component added to app layout
- [x] Build scripts added to package.json
- [x] GitHub Actions workflow created
- [x] TypeScript types generated

## 🚀 Quick Start

### 1. Configure GitHub Secrets (for Automation)

Add these secrets to your GitHub repository:

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these two secrets:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY
Value: your-service-role-key-here
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Click on the gear icon (Settings)
- Go to **API** section
- Copy the values from there

### 2. Test the System

#### Test the API Endpoint
```bash
# Start dev server
cd web
pnpm dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/version
```

You should see:
```json
{
  "version": "1.0.0",
  "buildNumber": 1,
  "gitCommit": "abc123",
  "deployedAt": "2026-02-03T..."
}
```

#### Test Version Update Script
```bash
cd web
pnpm version:update
```

You should see:
```
🔄 Updating app version...
⬆️  Patch version bump: 1.0.0 → 1.0.1
✅ App version updated successfully!
   Version: 1.0.1
   Build: #2
   Commit: abc123
```

#### Test Update Detection in Browser
1. Open your app in a browser
2. Open browser console (F12)
3. In terminal, run: `pnpm version:update`
4. Wait up to 5 minutes OR navigate to a different page
5. You should see the blue update banner appear at the top

### 3. Verify Automation

Push a change to the `main` branch:

```bash
git add .
git commit -m "test: trigger version update"
git push origin main
```

Then:
1. Go to: **Actions** tab in GitHub
2. You should see "Update App Version" workflow running
3. Check that it completes successfully
4. Verify version was incremented in database

## 🔧 Configuration Options

### Change Polling Interval

Edit `web/src/app/(app)/layout.tsx`:

```tsx
<UpdateBanner 
  pollingInterval={600000}  // 10 minutes instead of 5
  checkOnRouteChange={true}
/>
```

### Disable Update Checking (Temporarily)

```tsx
<UpdateBanner 
  pollingInterval={0}  // Disables polling
  checkOnRouteChange={false}  // Disables route checks
/>
```

Or comment out the component entirely.

## 📖 Usage

### Automatic Version Updates (Recommended)

Every push to `main` automatically increments the patch version:
- `1.0.0` → `1.0.1` → `1.0.2` → ...

No manual intervention needed!

### Manual Version Updates

```bash
cd web

# Patch version (bug fixes): 1.0.0 → 1.0.1
pnpm version:update

# Minor version (new features): 1.0.5 → 1.1.0
pnpm version:minor

# Major version (breaking changes): 1.5.3 → 2.0.0
pnpm version:major

# Custom version
pnpm version:update --version=2.0.0
```

## 🧪 Testing Checklist

- [ ] API endpoint returns valid JSON
- [ ] Version update script runs without errors
- [ ] Update banner appears when version changes
- [ ] Reload button refreshes the page
- [ ] Dismiss button hides the banner
- [ ] GitHub Actions workflow completes successfully

## 📚 Documentation

For detailed information, see:
- `web/scripts/VERSION_TRACKING.md` - Complete system documentation
- `web/src/hooks/useAppVersion.ts` - Hook implementation details
- `web/src/components/UpdateBanner.tsx` - Banner component
- `.github/workflows/update-version.yml` - Automation workflow

## 🆘 Troubleshooting

### Banner not appearing?
1. Check browser console for errors
2. Verify `/api/version` returns data
3. Try manually updating version: `pnpm version:update`
4. Check polling interval hasn't been disabled

### GitHub Actions failing?
1. Verify secrets are set correctly
2. Check workflow logs in Actions tab
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` has write permissions

### Script errors?
1. Ensure `.env.local` has correct values
2. Check database connection
3. Verify migration was applied: check `app_version` table exists

## ✨ Next Steps

You're all set! The system will now:
1. ✅ Auto-increment version on each push to main
2. ✅ Notify users when updates are available
3. ✅ Allow users to refresh to get latest version
4. ✅ Track version history in database

Users will always be on the latest version, preventing API mismatches and missing bug fixes!
