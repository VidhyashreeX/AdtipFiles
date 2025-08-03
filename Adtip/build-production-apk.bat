@echo off
echo Building Production APK with Error Handling Fixes...

REM Clean the project
echo Cleaning project...
cd android
call gradlew clean
cd ..

REM Remove node_modules and reinstall (optional, uncomment if needed)
REM echo Removing node_modules...
REM rmdir /s /q node_modules
REM echo Installing dependencies...
REM npm install

REM Build production APK
echo Building production APK...
cd android
call gradlew assembleRelease

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Production APK built successfully!
    echo 📱 APK location: android/app/build/outputs/apk/release/app-release.apk
    echo.
    echo 🚨 IMPORTANT: This APK includes error handling fixes for CallKeep issues
    echo 💡 The app will now handle CallKeep errors gracefully in production
    echo.
) else (
    echo.
    echo ❌ Build failed! Please check the error messages above.
    echo.
)

cd ..
pause 