#!/bin/bash

# =============================================================================
# iOS Build Reset (Light)
# =============================================================================
# Quick, safe cleanup of common cache issues. Non-destructive.
# For a full nuclear reset, use: ./reset-ios.sh --hard
#
# ⚠️  NEVER RUN THESE COMMANDS (they will break the build):
#   - expo prebuild --clean    (wipes custom Podfile configurations)
#   - rm ios/Podfile           (removes critical native settings)
#
# This script is safe because it preserves:
#   - ios/Podfile (contains Agora Chat, Worklets, and other critical configs)
#   - react-native.config.js (contains autolinking settings)
# =============================================================================

HARD_RESET=false
if [[ "$1" == "--hard" ]]; then
    HARD_RESET=true
    echo "⚠️  Running HARD RESET - this will take longer but be more thorough"
    echo ""
fi

echo "🛑 Step 1: Stopping running dev servers and simulators..."

# Kill Metro bundler on port 8081 (the main culprit for "port in use" errors)
echo "   Killing Metro bundler (port 8081)..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Kill Expo dev server on port 8082 (if using Expo)
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Kill React Native packager processes
pkill -f "react-native start" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "@expo/metro-runtime" 2>/dev/null || true

# Kill iOS Simulator
echo "   Killing iOS Simulator..."
killall "Simulator" 2>/dev/null || true
xcrun simctl shutdown all 2>/dev/null || true

if $HARD_RESET; then
    echo ""
    echo "🛑 Step 1b (HARD): Stopping Xcode processes..."
    killall -9 Xcode 2>/dev/null || true
    killall -9 XcodeBuildService 2>/dev/null || true
    killall -9 SourceKitService 2>/dev/null || true
fi

echo ""
echo "🗑️  Step 2: Removing iOS build artifacts..."
rm -rf ios/build

echo ""
echo "🗑️  Step 3: Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

if $HARD_RESET; then
    echo ""
    echo "🧹 Step 4 (HARD): Cleaning project-specific Xcode DerivedData..."
    # Find and remove only THIS project's DerivedData, not all projects
    DERIVED_DATA_PATH=$(find ~/Library/Developer/Xcode/DerivedData -maxdepth 1 -type d -name "TruSingle-*" 2>/dev/null | head -1)
    if [[ -n "$DERIVED_DATA_PATH" ]]; then
        rm -rf "$DERIVED_DATA_PATH"
        echo "   Removed: $DERIVED_DATA_PATH"
    else
        echo "   No project-specific DerivedData found"
    fi
    
    echo ""
    echo "🗑️  Step 5 (HARD): Reinstalling node_modules..."
    rm -rf node_modules
    pnpm install
    
    echo ""
    echo "📦 Step 6 (HARD): Reinstalling CocoaPods..."
    cd ios
    rm -rf Pods
    rm -f Podfile.lock
    pod cache clean --all
    pod install --repo-update
    cd ..
else
    echo ""
    echo "📦 Step 4: Ensuring dependencies are up to date..."
    pnpm install
    
    echo ""
    echo "📦 Step 5: Refreshing CocoaPods (if needed)..."
    cd ios
    if [[ ! -d "Pods" ]]; then
        echo "   Pods directory missing, running pod install..."
        pod install
    else
        echo "   Pods directory exists, skipping pod install"
        echo "   (use --hard to force reinstall)"
    fi
    cd ..
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run the app:"
echo "  pnpm ios"
echo ""
echo "Or open in Xcode:"
echo "  open ios/TruSingle.xcworkspace"
echo ""
if ! $HARD_RESET; then
    echo "If issues persist, try the hard reset:"
    echo "  ./reset-ios.sh --hard"
    echo ""
fi
echo "⚠️  NEVER run 'expo prebuild --clean' - it will break the build!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
