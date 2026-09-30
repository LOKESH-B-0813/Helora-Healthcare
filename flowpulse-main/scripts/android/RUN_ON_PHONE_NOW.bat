@echo off
cls
echo ======================================================================
echo    FLOWPULSE AI - LAUNCH PATIENT APP ON CONNECTED MOBILE PHONE
echo ======================================================================
echo.

cd /d "%~dp0..\..\mobile"

:: Set ADB path
set "PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%"

echo [1/3] Detecting USB-connected Android phone...
adb devices -l
echo.

echo [2/3] Setting up USB port bridge (tcp:8081)...
adb reverse tcp:8081 tcp:8081
echo.

echo [3/3] Launching FlowPulse Patient App on your phone...
echo.
echo ----------------------------------------------------------------------
echo  The app is launching on your connected phone screen right now!
echo  If prompted on phone, open with "Expo Go" or accept the USB prompt.
echo ----------------------------------------------------------------------
echo.

call npx expo start --android
pause
