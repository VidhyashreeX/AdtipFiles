@echo off
REM ================================================================================================
REM ADTIP PRODUCTION CONFIGURATION VERIFICATION SCRIPT
REM ================================================================================================

echo.
echo ================================================================================================
echo ADTIP PRODUCTION CONFIGURATION VERIFICATION
echo ================================================================================================
echo.

set "CONFIG_OK=true"

echo [1/8] Checking build.gradle configuration...
echo.

REM Check if ProGuard is enabled
findstr /C:"enableProguardInReleaseBuilds = true" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ ProGuard is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ ProGuard is enabled
)

REM Check if R8 full mode is enabled
findstr /C:"enableR8FullMode = true" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ R8 full mode is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ R8 full mode is enabled
)

REM Check if ABI splitting is enabled
findstr /C:"enableSeparateBuildPerCPUArchitecture = true" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ ABI splitting is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ ABI splitting is enabled
)

echo.
echo [2/8] Checking gradle.properties configuration...
echo.

REM Check if R8 full mode is enabled in gradle.properties
findstr /C:"android.enableR8.fullMode=true" android\gradle.properties >nul
if errorlevel 1 (
    echo ❌ R8 full mode is NOT enabled in gradle.properties
    set "CONFIG_OK=false"
) else (
    echo ✅ R8 full mode is enabled in gradle.properties
)

REM Check if Hermes is enabled
findstr /C:"hermesEnabled=true" android\gradle.properties >nul
if errorlevel 1 (
    echo ❌ Hermes is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ Hermes is enabled
)

echo.
echo [3/8] Checking ProGuard rules files...
echo.

if exist "android\app\proguard-rules.pro" (
    echo ✅ Main ProGuard rules file exists
) else (
    echo ❌ Main ProGuard rules file is MISSING
    set "CONFIG_OK=false"
)

if exist "android\app\proguard-rules-r8.pro" (
    echo ✅ R8 ProGuard rules file exists
) else (
    echo ❌ R8 ProGuard rules file is MISSING
    set "CONFIG_OK=false"
)

echo.
echo [4/8] Checking signing configuration...
echo.

findstr /C:"signingConfig signingConfigs.release" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ Release signing configuration is NOT set
    set "CONFIG_OK=false"
) else (
    echo ✅ Release signing configuration is set
)

if exist "android\app\adtip-jks1.jks" (
    echo ✅ Release keystore file exists
) else (
    echo ❌ Release keystore file is MISSING
    set "CONFIG_OK=false"
)

echo.
echo [5/8] Checking build optimization settings...
echo.

findstr /C:"minifyEnabled enableProguardInReleaseBuilds" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ Minification is NOT enabled for release builds
    set "CONFIG_OK=false"
) else (
    echo ✅ Minification is enabled for release builds
)

findstr /C:"shrinkResources enableProguardInReleaseBuilds" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ Resource shrinking is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ Resource shrinking is enabled
)

echo.
echo [6/8] Checking React Native bundle optimization...
echo.

findstr /C:"hermesFlags = " android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ Hermes optimization flags are NOT set
    set "CONFIG_OK=false"
) else (
    echo ✅ Hermes optimization flags are set
)

findstr /C:"--minify" android\app\build.gradle >nul
if errorlevel 1 (
    echo ❌ Bundle minification is NOT enabled
    set "CONFIG_OK=false"
) else (
    echo ✅ Bundle minification is enabled
)

echo.
echo [7/8] Checking build scripts...
echo.

if exist "build-production.bat" (
    echo ✅ Windows production build script exists
) else (
    echo ❌ Windows production build script is MISSING
    set "CONFIG_OK=false"
)

if exist "build-production.sh" (
    echo ✅ Linux/Mac production build script exists
) else (
    echo ❌ Linux/Mac production build script is MISSING
    set "CONFIG_OK=false"
)

echo.
echo [8/8] Checking documentation...
echo.

if exist "PRODUCTION_BUILD_GUIDE.md" (
    echo ✅ Production build guide exists
) else (
    echo ❌ Production build guide is MISSING
    set "CONFIG_OK=false"
)

echo.
echo ================================================================================================
echo VERIFICATION SUMMARY
echo ================================================================================================
echo.

if "%CONFIG_OK%"=="true" (
    echo ✅ ALL PRODUCTION OPTIMIZATIONS ARE PROPERLY CONFIGURED!
    echo.
    echo Your app is ready for production builds with:
    echo   • ProGuard/R8 minification and obfuscation
    echo   • Resource shrinking and optimization
    echo   • ARM-specific APK splitting (real devices only)
    echo   • Hermes JavaScript engine optimization
    echo   • Bundle minification and optimization
    echo   • Production signing configuration
    echo.
    echo To build production APK/AAB, run:
    echo   build-production.bat  (Windows)
    echo   ./build-production.sh (Linux/Mac)
) else (
    echo ❌ SOME PRODUCTION OPTIMIZATIONS ARE MISSING OR MISCONFIGURED!
    echo.
    echo Please review the errors above and fix the configuration.
    echo Refer to PRODUCTION_BUILD_GUIDE.md for detailed instructions.
)

echo.
echo ================================================================================================
echo.

pause
