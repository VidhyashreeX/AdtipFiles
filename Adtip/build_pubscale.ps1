# build_pubscale.ps1
# PowerShell script to build and test PubScale integration
# Commented out PubScale integration - June 2, 2025

<#
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "PubScale SDK Integration" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
#>

# Commented out PubScale integration - June 2, 2025
<#
# Kill Metro if it's running
Write-Host "Stopping Metro bundler if running..." -ForegroundColor Yellow
npx react-native kill-packager

# Clean project
Write-Host "Cleaning Android build artifacts..." -ForegroundColor Yellow
Push-Location android
.\gradlew clean
Pop-Location

# Remove node_modules and reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path -Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
npm install

# Build the app
Write-Host "Building Android app..." -ForegroundColor Yellow
npm run android

# Display logs with PubScale related info
Write-Host "Checking logs for PubScale initialization..." -ForegroundColor Yellow
adb logcat -d | Select-String -Pattern "PubScale|Offerwall|com.adtip.Pubscale"

Write-Host "Done! Check the logs above for any PubScale-related errors." -ForegroundColor Green
#>

Write-Host "PubScale integration is currently disabled." -ForegroundColor Yellow
Write-Host "This script has been commented out. To re-enable, please remove the comment markers." -ForegroundColor Yellow
Write-Host "To test the PubScale integration, navigate to the Wallet screen and tap on 'Earn More Coins'." -ForegroundColor Green
