#!/bin/bash

# =============================================================================
# Fix Xcode Issues (Nuclear Option)
# =============================================================================
# This is a more aggressive reset for Xcode-specific issues.
# Use when normal resets don't fix build/indexing problems.
#
# ⚠️  WARNING: This removes ALL Xcode DerivedData (affects other projects too)
#
# ⚠️  NEVER RUN THESE COMMANDS (they will break the build):
#   - expo prebuild --clean    (wipes custom Podfile configurations)
#   - rm ios/Podfile           (removes critical native settings)
# =============================================================================

echo "🔧 Killing stale Xcode processes..."
killall -9 Xcode 2>/dev/null || true
killall -9 XcodeBuildService 2>/dev/null || true
killall -9 SourceKitService 2>/dev/null || true

echo "🧹 Cleaning Xcode caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Developer/Xcode/ModuleCache.noindex
rm -rf ~/Library/Caches/org.swift.swiftpm
rm -rf ~/Library/org.swift.swiftpm

echo "🗑️ Removing ios/build folder..."
rm -rf ios/build

echo "📦 Reinstalling Pods..."
cd ios || exit
pod deintegrate
pod install --repo-update
cd ..

echo "✅ Cleanup done! Now open the workspace:"
echo "   open ios/RealSingles.xcworkspace"
echo ""
echo "⚠️  NEVER run 'expo prebuild --clean' - it will break the build!"

