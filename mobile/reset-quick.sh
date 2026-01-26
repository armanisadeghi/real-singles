#!/bin/bash

# =============================================================================
# Quick Reset Script for React Native Development
# =============================================================================
# Kills processes and clears caches without full rebuild.
# This is the FASTEST and SAFEST reset option.
#
# ⚠️  NEVER RUN THESE COMMANDS (they will break the build):
#   - expo prebuild --clean    (wipes custom Podfile/native configurations)
#   - rm ios/Podfile           (removes critical native settings)
#
# This script is safe because it ONLY clears:
#   - Running processes
#   - Metro bundler cache
#   - Build artifacts (not source files or configs)
# =============================================================================

echo "🚀 Quick Reset - Preparing for fresh development session..."
echo ""

# ============================================================================
# Step 1: Kill Development Processes
# ============================================================================
echo "🛑 Killing development processes..."

# Kill Metro bundler (port 8081)
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Kill React Native & Metro processes
pkill -f "react-native" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "@react-native" 2>/dev/null || true

# Android: Kill Gradle daemon
pkill -f "GradleDaemon" 2>/dev/null || true
./android/gradlew --stop 2>/dev/null || true

# iOS: Kill Xcode build services (not Xcode itself)
killall -9 XcodeBuildService 2>/dev/null || true
killall -9 SourceKitService 2>/dev/null || true

echo "   ✅ Processes stopped"

# ============================================================================
# Step 2: Clear Metro Bundler Cache (Fast)
# ============================================================================
echo ""
echo "🧹 Clearing Metro bundler cache..."

rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

echo "   ✅ Metro cache cleared"

# ============================================================================
# Step 3: Clear Build Artifacts (Not Dependencies)
# ============================================================================
echo ""
echo "🗑️  Clearing build artifacts..."

# Android: Only local build folders (not gradle cache or dependencies)
rm -rf android/app/build/intermediates/merged_assets 2>/dev/null || true
rm -rf android/app/build/intermediates/merged_res 2>/dev/null || true
rm -rf android/app/src/main/assets/index.android.bundle 2>/dev/null || true

# iOS: Only derived data (not Pods)
rm -rf ios/build 2>/dev/null || true

echo "   ✅ Build artifacts cleared"

# ============================================================================
# Step 4: Clear Watchman (if installed)
# ============================================================================
echo ""
echo "👁️  Resetting Watchman..."

if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
    echo "   ✅ Watchman reset"
else
    echo "   ⏭️  Watchman not installed (skipping)"
fi

# ============================================================================
# Done
# ============================================================================
echo ""
echo "✨ Quick reset complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Ready to start development:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Android:  pnpm android"
echo "  iOS:      pnpm ios"
echo ""
echo "  Metro:    pnpm start --reset-cache"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: If you still have issues, run the full reset scripts:"
echo "   ./reset-android.sh  (for Android)"
echo "   ./reset-ios.sh      (for iOS)"
echo ""
echo "⚠️  NEVER run 'expo prebuild --clean' - it will break the build!"
echo ""
