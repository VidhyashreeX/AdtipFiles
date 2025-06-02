#!/bin/bash
# build_pubscale.sh
# Commented out PubScale integration - June 2, 2025

# echo "========================="
# echo "PubScale SDK Integration"
# echo "========================="

# Commented out PubScale integration - June 2, 2025
: <<'END_COMMENT'
# Kill Metro if it's running
echo "Stopping Metro bundler if running..."
npx react-native kill-packager

# Clean project
echo "Cleaning Android build artifacts..."
cd android
./gradlew clean
cd ..

# Remove node_modules and reinstall dependencies
echo "Reinstalling dependencies..."
rm -rf node_modules
npm install

# Build the app
echo "Building Android app..."
npm run android

# Display logs with PubScale related info
echo "Checking logs for PubScale initialization..."
adb logcat -d | grep -E "PubScale|Offerwall|com.adtip.Pubscale"

echo "Done! Check the logs above for any PubScale-related errors."

echo "To test the PubScale integration, navigate to the Wallet screen and tap on 'Earn More Coins'."
END_COMMENT

echo "PubScale integration is currently disabled."
echo "This script has been commented out. To re-enable, please remove the comment markers."
