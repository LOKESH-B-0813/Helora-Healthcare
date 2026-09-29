@echo off
echo ================================================================
echo   FlowPulse AI Mobile - Build ^& Deploy Native Standalone APK
echo ================================================================
echo.
cd /d "%~dp0"

echo [Step 1/3] Generating native Android project via Expo prebuild...
npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo Prebuild encountered an error. Please check Android SDK and Java.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 2/3] Compiling Native Android Debug APK via Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Gradle build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 3/3] Installing APK directly to connected mobile device...
adb install -r app\build\outputs\apk\debug\app-debug.apk

echo.
echo ================================================================
echo   SUCCESS! FlowPulse Patient APK installed on your mobile phone.
echo ================================================================
pause
