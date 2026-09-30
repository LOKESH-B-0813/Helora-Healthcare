@echo off
setlocal enabledelayedexpansion
cls

echo ======================================================================
echo    FLOWPULSE AI - COMPLETE NATIVE ANDROID BUILD & INSTALL TO PHONE
echo ======================================================================
echo.

cd /d "%~dp0..\..\mobile"

echo [1/5] Setting up valid image assets...
call node make_assets.js

echo.
echo [2/5] Setting up Android SDK Environment Variables...
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"

echo ANDROID_HOME: %ANDROID_HOME%
echo.

echo [3/5] Generating Native Android project structure via Expo prebuild...
echo y | call npx expo prebuild --platform android --clean --no-install

echo.
echo [4/5] Writing SDK path and Gradle memory configuration...
if not exist "android" (
    echo [ERROR] android/ folder was not created by prebuild.
    pause
    exit /b 1
)

echo sdk.dir=%ANDROID_HOME:\=\\%> android\local.properties

cd android

echo.
echo [5/5] Compiling APK with Gradle (Safe Memory Mode)...
call gradlew.bat assembleDebug --no-daemon -Dorg.gradle.jvmargs="-Xmx1024m -XX:MaxMetaspaceSize=384m -XX:+UseG1GC"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo   [ERROR] Gradle compilation failed. See output above.
    echo ======================================================================
    pause
    exit /b %ERRORLEVEL%
)

cd ..
set "APK_PATH=%CD%\android\app\build\outputs\apk\debug\app-debug.apk"

echo.
echo ======================================================================
echo   BUILD SUCCESSFUL!
echo   APK File: %APK_PATH%
echo ======================================================================
echo.

echo Installing APK directly to your connected Android phone via ADB...
adb install -r "%APK_PATH%"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! FlowPulse Patient app has been installed on your phone!
    echo ======================================================================
    echo Launching app...
    adb shell monkey -p com.flowpulse.patient -c android.intent.category.LAUNCHER 1
) else (
    echo [Notice] ADB install failed. Make sure phone is unlocked and authorized.
    explorer.exe /select,"%APK_PATH%"
)

echo.
pause
