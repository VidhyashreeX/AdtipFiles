# clean_and_build.ps1
# PowerShell script to clean and rebuild the app with PubScale integration

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Adtip App - PubScale Integration Clean & Build" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Kill Metro if it's running
Write-Host "Stopping Metro bundler if running..." -ForegroundColor Yellow
npx react-native kill-packager

# Clean Gradle cache
Write-Host "Cleaning Gradle cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\*" -Recurse -Force -ErrorAction SilentlyContinue

# Clean the project
Write-Host "Cleaning project..." -ForegroundColor Yellow
Push-Location android
./gradlew clean
Pop-Location

# Build the app in debug mode with more verbose output
Write-Host "Building app in debug mode..." -ForegroundColor Yellow
Push-Location android
./gradlew --info assembleDebug
Pop-Location

Write-Host "Build completed. Check the output above for any errors." -ForegroundColor Green

# Run the app
Write-Host "Running the app..." -ForegroundColor Yellow
npm run android

Write-Host "Process completed!" -ForegroundColor Green
