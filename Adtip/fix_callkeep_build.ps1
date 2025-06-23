# CallKeep Fix Build Script
# This script cleans and rebuilds the project to apply CallKeep fixes

Write-Host "🔧 Starting CallKeep Fix Build Process..." -ForegroundColor Green

# Step 1: Clean React Native cache
Write-Host "🧹 Cleaning React Native cache..." -ForegroundColor Yellow
npx react-native clean

# Step 2: Clean node modules and reinstall
Write-Host "🧹 Cleaning node modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Step 3: Clean Gradle
Write-Host "🧹 Cleaning Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean
Set-Location ..

# Step 4: Clean Metro cache
Write-Host "🧹 Cleaning Metro cache..." -ForegroundColor Yellow
npx react-native start --reset-cache --port=8081 &
Start-Sleep -Seconds 5
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Step 5: Rebuild Android
Write-Host "🔨 Building Android..." -ForegroundColor Green
npx react-native run-android

Write-Host "✅ CallKeep Fix Build Process Complete!" -ForegroundColor Green
Write-Host "📱 The app should now start without the self-managed phone account error." -ForegroundColor Cyan
