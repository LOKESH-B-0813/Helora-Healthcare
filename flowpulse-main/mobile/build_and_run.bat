@echo off
setlocal enabledelayedexpansion
title FlowPulse AI Mobile Build & Deploy Tool
cls

echo ================================================================
echo        FLOWPULSE AI - MOBILE BUILD & DEPLOY ASSISTANT
echo ================================================================
echo.
echo Connected Device Inspection:
adb devices -l
echo.
echo Select how you want to build/run the app on your mobile phone:
echo.
echo  [1] Live Hot-Reload Debug on Connected Mobile (Recommended)
echo      - Reverses USB Port 8081
echo      - Starts Expo Metro Bundler
echo      - Automatically launches app on your connected phone
echo.
echo  [2] Compile Standalone Native Android Debug APK (.apk)
echo      - Runs Expo Prebuild
echo      - Compiles native Gradle app-debug.apk
echo      - Installs directly to connected phone via ADB
echo.
echo  [3] Web Browser Preview Mode
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto live_debug
if "%choice%"=="2" goto build_apk
if "%choice%"=="3" goto web_preview

echo Invalid choice. Defaulting to Live Mobile Debug...
goto live_debug

:live_debug
echo.
echo ----------------------------------------------------------------
echo Setting up USB tunnel and launching on mobile...
echo ----------------------------------------------------------------
cd /d "%~dp0"
adb reverse tcp:8081 tcp:8081
echo Reverse port 8081 active. Starting Expo...
npx expo start --android
goto end

:build_apk
echo.
echo ----------------------------------------------------------------
echo Building Standalone Native Android APK...
echo ----------------------------------------------------------------
cd /d "%~dp0"
echo Step 1: Prebuilding native Android project...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo Prebuild warning or error. Continuing to Gradle...
)
cd android
echo Step 2: Compiling APK with Gradle...
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Gradle compilation encountered an issue. Check JAVA_HOME and memory.
    pause
    goto end
)
echo Step 3: Installing APK to connected mobile device...
adb install -r app\build\outputs\apk\debug\app-debug.apk
echo.
echo SUCCESS! FlowPulse APK installed on your mobile phone.
pause
goto end

:web_preview
echo.
echo Starting Web preview...
cd /d "%~dp0"
npx expo start --web
goto end

:end
