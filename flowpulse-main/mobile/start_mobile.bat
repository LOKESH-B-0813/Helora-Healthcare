@echo off
echo ================================================================
echo   FlowPulse AI Mobile - Connected Phone Debug ^& Live Metro Server
echo ================================================================
echo.
cd /d "%~dp0"

echo [Step 1/3] Checking connected Android ADB devices...
adb devices -l
echo.

echo [Step 2/3] Reversing Metro port 8081 over USB...
adb reverse tcp:8081 tcp:8081
echo.

echo [Step 3/3] Launching Expo on connected mobile device...
echo.
echo * Note: Press 'a' in the terminal at any time to open on Android.
echo * If Expo Go is not installed, scan the QR code using your phone camera.
echo.
npx expo start --android
