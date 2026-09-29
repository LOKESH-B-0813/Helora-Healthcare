@echo off
cls
echo ======================================================================
echo    FLOWPULSE AI - BUILD & INSTALL NATIVE ANDROID APK TO PHONE
echo ======================================================================
echo.
cd /d "%~dp0"

echo [1/3] Generating native Android files via Expo prebuild...
echo y | call npx expo prebuild --platform android --clean --no-install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Prebuild had a warning or error. Proceeding to Gradle build...
)

echo.
echo [2/3] Compiling Native Android Debug APK with Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Gradle build encountered an error. Please check Java / memory.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Installing APK directly to your connected mobile phone...
adb install -r app\build\outputs\apk\debug\app-debug.apk
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ADB install failed. Make sure phone is unlocked and USB debugging is Allowed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================================
echo   SUCCESS! FlowPulse Patient app is installed on your mobile phone!
echo ======================================================================
echo.
pause
