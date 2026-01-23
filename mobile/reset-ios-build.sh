#!/bin/bash

echo "🛑 Step 1: Stopping all processes..."
killall -9 Xcode 2>/dev/null || true
killall -9 XcodeBuildService 2>/dev/null || true
killall -9 SourceKitService 2>/dev/null || true
killall -9 node 2>/dev/null || true
killall -9 Metro 2>/dev/null || true

echo ""
echo "🧹 Step 2: Cleaning Xcode caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/ModuleCache.noindex/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode/*
rm -rf ~/Library/Caches/org.swift.swiftpm/*
rm -rf ~/Library/org.swift.swiftpm/*

echo ""
echo "🗑️  Step 3: Removing iOS build artifacts..."
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ios/.xcode.env.local

echo ""
echo "🗑️  Step 4: Cleaning node_modules and reinstalling..."
rm -rf node_modules
pnpm install

echo ""
echo "📦 Step 5: Installing CocoaPods dependencies..."
cd ios
pod deintegrate
rm -rf Pods
rm -rf TruSingle.xcworkspace
pod cache clean --all
pod install --repo-update --verbose

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open Xcode workspace:"
echo "   open ios/TruSingle.xcworkspace"
echo ""
echo "2. In Xcode menu: Product → Clean Build Folder (⌘⇧K)"
echo ""
echo "3. Build and Run (⌘R)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
