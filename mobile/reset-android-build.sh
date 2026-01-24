#!/bin/bash

echo "🛑 Step 1: Stopping all processes..."
killall -9 "Android Studio" 2>/dev/null || true
killall -9 java 2>/dev/null || true
killall -9 node 2>/dev/null || true
killall -9 Metro 2>/dev/null || true
killall -9 gradle 2>/dev/null || true
killall -9 qemu-system-x86_64 2>/dev/null || true
killall -9 qemu-system-aarch64 2>/dev/null || true

echo ""
echo "🧹 Step 2: Cleaning Gradle caches..."
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/daemon/
rm -rf ~/.android/build-cache/

echo ""
echo "🗑️  Step 3: Removing Android build artifacts..."
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/app/.cxx
rm -rf android/app/src/main/assets/index.android.bundle
rm -rf android/app/src/main/res/drawable-*
rm -rf android/app/src/main/res/raw

echo ""
echo "🗑️  Step 4: Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*

echo ""
echo "🗑️  Step 5: Cleaning node_modules and reinstalling..."
rm -rf node_modules
pnpm install

echo ""
echo "🧼 Step 6: Cleaning Gradle project..."
cd android
./gradlew clean
./gradlew cleanBuildCache

echo ""
echo "📦 Step 7: Building fresh Gradle dependencies..."
./gradlew --refresh-dependencies
cd ..

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option A - Run on Emulator:"
echo "  1. Start emulator (or it will auto-start):"
echo "     emulator -avd <your-avd-name>"
echo ""
echo "  2. Run the app:"
echo "     pnpm android"
echo "     # or: npx react-native run-android"
echo ""
echo "Option B - Using Android Studio:"
echo "  1. Open Android Studio:"
echo "     studio android/"
echo ""
echo "  2. Build → Clean Project"
echo ""
echo "  3. Build → Rebuild Project"
echo ""
echo "  4. Run → Run 'app'"
echo ""
echo "Option C - Direct Gradle build:"
echo "  cd android && ./gradlew assembleDebug"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
