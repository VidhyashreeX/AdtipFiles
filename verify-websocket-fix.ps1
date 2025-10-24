# WebSocket Fix Verification Script (PowerShell)
# Run this script to verify all the fixes are in place

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "WebSocket Crash Fix Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "Adtip\android")) {
    Write-Host "[X] Error: Please run this script from the adtip-reactnative root directory" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Running from correct directory" -ForegroundColor Green
Write-Host ""

# 1. Check ProGuard rules
Write-Host "1. Checking ProGuard rules..." -ForegroundColor Yellow
$proguardContent = Get-Content "Adtip\android\app\proguard-rules.pro" -Raw

if ($proguardContent -match "okhttp3\.internal\.ws\.MessageDeflater") {
    Write-Host "   [OK] MessageDeflater ProGuard rules present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing MessageDeflater ProGuard rules" -ForegroundColor Red
}

if ($proguardContent -match "io\.socket\.engineio") {
    Write-Host "   [OK] Socket.IO ProGuard rules present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing Socket.IO ProGuard rules" -ForegroundColor Red
}

# 2. Check Gradle dependencies
Write-Host ""
Write-Host "2. Checking Gradle dependencies..." -ForegroundColor Yellow
$gradleContent = Get-Content "Adtip\android\app\build.gradle" -Raw

if ($gradleContent -match "com\.squareup\.okhttp3:okhttp:4\.12\.0") {
    Write-Host "   [OK] OkHttp 4.12.0 dependency present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing OkHttp 4.12.0 dependency" -ForegroundColor Red
}

if ($gradleContent -match "com\.squareup\.okio:okio:3\.6\.0") {
    Write-Host "   [OK] Okio 3.6.0 dependency present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing Okio 3.6.0 dependency" -ForegroundColor Red
}

# 3. Check resolution strategy
Write-Host ""
Write-Host "3. Checking Gradle resolution strategy..." -ForegroundColor Yellow
if ($gradleContent -match "resolutionStrategy") {
    Write-Host "   [OK] Resolution strategy configured" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing resolution strategy" -ForegroundColor Red
}

# 4. Check SocketService changes
Write-Host ""
Write-Host "4. Checking SocketService configuration..." -ForegroundColor Yellow
$socketServiceContent = Get-Content "Adtip\src\services\SocketService.ts" -Raw

if ($socketServiceContent -match "perMessageDeflate") {
    Write-Host "   [OK] Message compression configuration present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing message compression configuration" -ForegroundColor Red
}

if ($socketServiceContent -match "trim\(\)") {
    Write-Host "   [OK] Input validation present" -ForegroundColor Green
}
else {
    Write-Host "   [X] Missing input validation" -ForegroundColor Red
}

# 5. Check for try-catch blocks
Write-Host ""
Write-Host "5. Checking error handling..." -ForegroundColor Yellow
$tryCatchCount = ([regex]::Matches($socketServiceContent, "try \{")).Count

if ($tryCatchCount -ge 4) {
    Write-Host "   [OK] Error handling implemented ($tryCatchCount try-catch blocks)" -ForegroundColor Green
}
else {
    Write-Host "   [!] Limited error handling (only $tryCatchCount try-catch blocks)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clean and rebuild the Android project:"
Write-Host "   cd Adtip\android; .\gradlew clean; .\gradlew assembleRelease"
Write-Host ""
Write-Host "2. Test WebSocket functionality:"
Write-Host "   - Join/leave stream rooms"
Write-Host "   - Send chat messages"
Write-Host "   - Test with empty messages (should be prevented)"
Write-Host ""
Write-Host "3. Monitor Firebase Crashlytics for MessageDeflater crashes"
Write-Host ""
