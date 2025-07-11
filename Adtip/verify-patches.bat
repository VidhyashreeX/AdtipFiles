@echo off
REM ================================================================================================
REM ADTIP PATCH VERIFICATION SCRIPT
REM ================================================================================================

echo.
echo ================================================================================================
echo ADTIP PATCH VERIFICATION
echo ================================================================================================
echo.

set "PATCHES_OK=true"

echo [1/3] Checking patch-package installation...
echo.

REM Check if patch-package is installed
npm list patch-package >nul 2>&1
if errorlevel 1 (
    echo ❌ patch-package is NOT installed
    set "PATCHES_OK=false"
) else (
    echo ✅ patch-package is installed
)

echo.
echo [2/3] Checking patch files...
echo.

REM Check if patches directory exists
if exist "patches" (
    echo ✅ patches directory exists
    
    REM Count patch files
    for /f %%i in ('dir /b patches\*.patch 2^>nul ^| find /c /v ""') do set PATCH_COUNT=%%i
    echo ✅ Found %PATCH_COUNT% patch file(s)
    
    REM List patch files
    echo.
    echo Patch files:
    for %%f in (patches\*.patch) do (
        echo   - %%~nxf
    )
) else (
    echo ❌ patches directory does NOT exist
    set "PATCHES_OK=false"
)

echo.
echo [3/3] Verifying patch application...
echo.

REM Check if react-native-callkeep patch is applied
findstr /C:"basicdisplayIncomingCall" "node_modules\react-native-callkeep\android\src\main\java\io\wazo\callkeep\RNCallKeepModule.java" >nul 2>&1
if errorlevel 1 (
    echo ❌ react-native-callkeep patch is NOT applied
    set "PATCHES_OK=false"
) else (
    echo ✅ react-native-callkeep patch is applied correctly
)

findstr /C:"basicstartCall" "node_modules\react-native-callkeep\android\src\main\java\io\wazo\callkeep\RNCallKeepModule.java" >nul 2>&1
if errorlevel 1 (
    echo ❌ react-native-callkeep basicstartCall method is NOT found
    set "PATCHES_OK=false"
) else (
    echo ✅ react-native-callkeep basicstartCall method is applied correctly
)

echo.
echo ================================================================================================
echo VERIFICATION SUMMARY
echo ================================================================================================
echo.

if "%PATCHES_OK%"=="true" (
    echo ✅ ALL PATCHES ARE WORKING CORRECTLY!
    echo.
    echo Your custom modifications are properly applied:
    echo   • patch-package is installed and configured
    echo   • Patch files exist in the patches directory
    echo   • react-native-callkeep custom methods are applied
    echo   • Patches will be automatically applied on npm install
    echo.
    echo Status: Ready for development and production ✅
) else (
    echo ❌ SOME PATCHES ARE NOT WORKING CORRECTLY!
    echo.
    echo Please fix the issues above. Common solutions:
    echo   1. Run: npm install (to apply patches)
    echo   2. Run: npx patch-package (to manually apply patches)
    echo   3. Check if node_modules directory exists
    echo   4. Verify patch files are not corrupted
    echo.
    echo Refer to PATCH_MANAGEMENT.md for detailed troubleshooting.
)

echo.
echo ================================================================================================
echo.

pause
