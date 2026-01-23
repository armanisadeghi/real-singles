#!/bin/bash

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
echo "   open ios/real-single-mobile.xcworkspace"

