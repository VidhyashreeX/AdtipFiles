# Build script for Adtip React Native Android with 16 KB page size support
# This script builds a production release AAB/APK with 16 KB support

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Building Adtip Android App" -ForegroundColor Cyan
Write-Host "with 16 KB Page Size Support" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to android directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\android"

Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
.\gradlew.bat clean
Write-Host "✓ Clean complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Building Release AAB (App Bundle)..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease
Write-Host "✓ AAB build complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Building Release APK..." -ForegroundColor Yellow
.\gradlew.bat assembleRelease
Write-Host "✓ APK build complete" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build outputs:"
Write-Host "  AAB: android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "  APK: android\app\build\outputs\apk\release\"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload the AAB to Google Play Console"
Write-Host "2. Verify 16 KB support in Play Console device catalog"
Write-Host "3. Test on Android 14/15 devices"
Write-Host ""
Write-Host "For more information, see docs\16KB_PAGE_SIZE_SUPPORT.md"
