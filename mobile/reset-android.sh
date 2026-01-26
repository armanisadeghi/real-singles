#!/bin/bash

# =============================================================================
# Android Build Reset (Light)
# =============================================================================
# Quick, safe cleanup of common cache issues. Non-destructive.
# For a full nuclear reset, use: ./reset-android.sh --hard
#
# ⚠️  NEVER RUN THESE COMMANDS (they will break the build):
#   - expo prebuild --clean    (wipes custom native configurations)
#
# This script is safe because it preserves:
#   - android/ native project files
#   - react-native.config.js (contains autolinking settings)
# =============================================================================

HARD_RESET=false
if [[ "$1" == "--hard" ]]; then
    HARD_RESET=true
    echo "⚠️  Running HARD RESET - this will take longer but be more thorough"
    echo ""
fi

echo "🛑 Step 1: Stopping running dev servers and emulators..."

# Kill Metro bundler on port 8081 (the main culprit for "port in use" errors)
echo "   Killing Metro bundler (port 8081)..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Kill Expo dev server on port 8082 (if using Expo)
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Kill React Native packager processes
pkill -f "react-native start" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "@expo/metro-runtime" 2>/dev/null || true

# Kill any running Android emulators (qemu processes)
echo "   Killing Android emulators..."
pkill -f "qemu-system-x86_64" 2>/dev/null || true
pkill -f "emulator64-crash-service" 2>/dev/null || true

# Stop Gradle daemon
echo "   Stopping Gradle daemon..."
pkill -f "GradleDaemon" 2>/dev/null || true
./android/gradlew --stop 2>/dev/null || true

# Kill adb server (will restart automatically when needed)
adb kill-server 2>/dev/null || true

echo ""
echo "🗑️  Step 2: Removing Android build artifacts..."
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/app/.cxx

# Clean ONLY the generated bundle, NOT the drawable folders (they contain source assets!)
rm -f android/app/src/main/assets/index.android.bundle
rm -f android/app/src/main/assets/index.android.bundle.map
rm -rf android/app/src/main/res/raw

echo ""
echo "🗑️  Step 3: Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

if $HARD_RESET; then
    echo ""
    echo "🧹 Step 4 (HARD): Cleaning project-local Gradle caches..."
    # Only clean PROJECT-LOCAL gradle caches, not global ~/.gradle
    rm -rf android/.gradle
    
    echo ""
    echo "🗑️  Step 5 (HARD): Reinstalling node_modules..."
    rm -rf node_modules
    pnpm install
    
    echo ""
    echo "🧼 Step 6 (HARD): Deep cleaning Gradle project..."
    cd android
    ./gradlew clean
    ./gradlew --refresh-dependencies
    cd ..
else
    echo ""
    echo "📦 Step 4: Ensuring dependencies are up to date..."
    pnpm install
    
    echo ""
    echo "🧼 Step 5: Cleaning Gradle project..."
    cd android
    ./gradlew clean
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
echo "  pnpm android"
echo ""
if ! $HARD_RESET; then
    echo "If issues persist, try the hard reset:"
    echo "  ./reset-android.sh --hard"
    echo ""
fi
echo "⚠️  NEVER run 'expo prebuild --clean' - it will break the build!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
