@echo off
REM ================================================================================================
REM ADTIP PRODUCTION BUILD SCRIPT
REM ================================================================================================

echo.
echo ================================================================================================
echo ADTIP PRODUCTION BUILD SCRIPT
echo ================================================================================================
echo.

REM Check if we're in the right directory
if not exist "android\app\build.gradle" (
    echo ERROR: This script must be run from the root of the React Native project
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/6] Cleaning previous builds...
echo.

REM Clean previous builds
call npx react-native clean
if errorlevel 1 (
    echo ERROR: Failed to clean React Native cache
    pause
    exit /b 1
)

cd android
call gradlew clean
if errorlevel 1 (
    echo ERROR: Failed to clean Android build
    pause
    exit /b 1
)
cd ..

echo.
echo [2/6] Installing dependencies...
echo.

REM Install dependencies
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install npm dependencies
    pause
    exit /b 1
)

echo.
echo [3/6] Generating React Native bundle...
echo.

REM Generate optimized bundle
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/ --minify true --reset-cache
if errorlevel 1 (
    echo ERROR: Failed to generate React Native bundle
    pause
    exit /b 1
)

echo.
echo [4/6] Building production APK...
echo.

REM Build production APK
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo ERROR: Failed to build production APK
    pause
    exit /b 1
)
cd ..

echo.
echo [5/6] Building production AAB (Android App Bundle)...
echo.

REM Build production AAB
cd android
call gradlew bundleRelease
if errorlevel 1 (
    echo ERROR: Failed to build production AAB
    pause
    exit /b 1
)
cd ..

echo.
echo [6/6] Build completed successfully!
echo.

echo ================================================================================================
echo BUILD ARTIFACTS LOCATION:
echo ================================================================================================
echo.
echo APK Files:
echo   - Universal APK: android\app\build\outputs\apk\release\app-release.apk
echo   - ARM64 APK: android\app\build\outputs\apk\release\app-arm64-v8a-release.apk
echo   - ARM APK: android\app\build\outputs\apk\release\app-armeabi-v7a-release.apk
echo   - x86_64 APK: android\app\build\outputs\apk\release\app-x86_64-release.apk
echo   - x86 APK: android\app\build\outputs\apk\release\app-x86-release.apk
echo.
echo AAB File:
echo   - Android App Bundle: android\app\build\outputs\bundle\release\app-release.aab
echo.
echo ================================================================================================
echo OPTIMIZATION FEATURES ENABLED:
echo ================================================================================================
echo.
echo ✓ ProGuard/R8 minification and obfuscation
echo ✓ Resource shrinking
echo ✓ Code optimization
echo ✓ Dead code elimination
echo ✓ ABI-specific APK splitting
echo ✓ Hermes JavaScript engine
echo ✓ React Native bundle minification
echo ✓ PNG optimization
echo ✓ Vector drawable optimization
echo ✓ Multidex support
echo ✓ Production signing configuration
echo.
echo ================================================================================================
echo NEXT STEPS:
echo ================================================================================================
echo.
echo 1. Test the APK on various devices before release
echo 2. Upload the AAB file to Google Play Console for distribution
echo 3. Use APK files for direct distribution or testing
echo.
echo Build completed at: %date% %time%
echo.

pause
