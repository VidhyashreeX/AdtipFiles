#!/bin/bash

# ================================================================================================
# ADTIP PRODUCTION BUILD SCRIPT
# ================================================================================================

echo ""
echo "================================================================================================"
echo "ADTIP PRODUCTION BUILD SCRIPT"
echo "================================================================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "android/app/build.gradle" ]; then
    echo "ERROR: This script must be run from the root of the React Native project"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "[1/6] Cleaning previous builds..."
echo ""

# Clean previous builds
npx react-native clean
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to clean React Native cache"
    exit 1
fi

cd android
./gradlew clean
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to clean Android build"
    exit 1
fi
cd ..

echo ""
echo "[2/6] Installing dependencies..."
echo ""

# Install dependencies
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install npm dependencies"
    exit 1
fi

echo ""
echo "[3/6] Generating React Native bundle..."
echo ""

# Create assets directory if it doesn't exist
mkdir -p android/app/src/main/assets

# Generate optimized bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/ --minify true --reset-cache
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate React Native bundle"
    exit 1
fi

echo ""
echo "[4/6] Building production APK..."
echo ""

# Build production APK
cd android
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build production APK"
    exit 1
fi
cd ..

echo ""
echo "[5/6] Building production AAB (Android App Bundle)..."
echo ""

# Build production AAB
cd android
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build production AAB"
    exit 1
fi
cd ..

echo ""
echo "[6/6] Build completed successfully!"
echo ""

echo "================================================================================================"
echo "BUILD ARTIFACTS LOCATION:"
echo "================================================================================================"
echo ""
echo "APK Files:"
echo "  - Universal APK: android/app/build/outputs/apk/release/app-release.apk"
echo "  - ARM64 APK: android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"
echo "  - ARM APK: android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk"
echo "  - x86_64 APK: android/app/build/outputs/apk/release/app-x86_64-release.apk"
echo "  - x86 APK: android/app/build/outputs/apk/release/app-x86-release.apk"
echo ""
echo "AAB File:"
echo "  - Android App Bundle: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "================================================================================================"
echo "OPTIMIZATION FEATURES ENABLED:"
echo "================================================================================================"
echo ""
echo "✓ ProGuard/R8 minification and obfuscation"
echo "✓ Resource shrinking"
echo "✓ Code optimization"
echo "✓ Dead code elimination"
echo "✓ ABI-specific APK splitting"
echo "✓ Hermes JavaScript engine"
echo "✓ React Native bundle minification"
echo "✓ PNG optimization"
echo "✓ Vector drawable optimization"
echo "✓ Multidex support"
echo "✓ Production signing configuration"
echo ""
echo "================================================================================================"
echo "NEXT STEPS:"
echo "================================================================================================"
echo ""
echo "1. Test the APK on various devices before release"
echo "2. Upload the AAB file to Google Play Console for distribution"
echo "3. Use APK files for direct distribution or testing"
echo ""
echo "Build completed at: $(date)"
echo ""
