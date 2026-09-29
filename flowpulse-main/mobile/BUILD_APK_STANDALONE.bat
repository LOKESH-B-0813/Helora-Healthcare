@echo off
setlocal enabledelayedexpansion
cls

echo ======================================================================
echo          FLOWPULSE AI - STANDALONE ANDROID APK BUILDER
echo ======================================================================
echo.
cd /d "%~dp0"

echo [Step 1/3] Generating Native Android project structure...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo [Notice] Prebuild finished with code %ERRORLEVEL%. Continuing...
)

echo.
echo [Step 2/3] Compiling standalone debug APK with Gradle...
if not exist "android" (
    echo [ERROR] android/ folder was not found. Prebuild may have failed.
    pause
    exit /b 1
)

cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gradle compilation failed.
    echo Please make sure JDK 17 or JDK 21 is installed and JAVA_HOME is set.
    pause
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
set "APK_PATH=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"

echo.
echo [Step 3/3] Checking output APK file...
if exist "%APK_PATH%" (
    echo.
    echo ======================================================================
    echo   BUILD SUCCESSFUL!
    echo   APK Location: %APK_PATH%
    echo ======================================================================
    echo.
    
    echo Checking for connected mobile phone to install...
    adb devices
    echo.
    echo Attempting to install APK to your connected phone via ADB...
    adb install -r "%APK_PATH%"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [SUCCESS] FlowPulse Patient APK has been installed on your phone!
    ) else (
        echo.
        echo [Notice] Phone not connected or install failed. 
        echo Opening the folder with your generated APK file...
        explorer.exe /select,"%APK_PATH%"
    )
) else (
    echo [ERROR] Could not find compiled APK at: %APK_PATH%
)

echo.
pause
