@echo off
cls
echo ======================================================================
echo    FLOWPULSE AI - LAUNCH & DEBUG ON CONNECTED ANDROID PHONE
echo ======================================================================
echo.
cd /d "%~dp0"

echo [1/3] Checking connected ADB device...
adb devices -l
echo.

echo [2/3] Setting up USB port forwarding (port 8081)...
adb reverse tcp:8081 tcp:8081
echo.

echo [3/3] Launching Expo on connected phone...
echo ----------------------------------------------------------------------
echo - If prompted on phone, tap "Allow USB Debugging".
echo - Press 'a' in this terminal to open on your phone anytime.
echo - Or scan the QR code with the Expo Go app.
echo ----------------------------------------------------------------------
echo.
npx expo start --android
pause
