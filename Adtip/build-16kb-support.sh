#!/bin/bash
# Build script for Adtip React Native Android with 16 KB page size support
# This script builds a production release AAB/APK with 16 KB support

set -e  # Exit on error

echo "=========================================="
echo "Building Adtip Android App"
echo "with 16 KB Page Size Support"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to android directory
cd "$(dirname "$0")/../android"

echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
./gradlew clean
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

echo -e "${YELLOW}Step 2: Building Release AAB (App Bundle)...${NC}"
./gradlew bundleRelease
echo -e "${GREEN}✓ AAB build complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building Release APK...${NC}"
./gradlew assembleRelease
echo -e "${GREEN}✓ APK build complete${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}Build Complete!${NC}"
echo "=========================================="
echo ""
echo "Build outputs:"
echo "  AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo "  APK: android/app/build/outputs/apk/release/"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload the AAB to Google Play Console"
echo "2. Verify 16 KB support in Play Console device catalog"
echo "3. Test on Android 14/15 devices"
echo ""
echo "For more information, see docs/16KB_PAGE_SIZE_SUPPORT.md"
