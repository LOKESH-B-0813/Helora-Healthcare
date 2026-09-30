@echo off
setlocal enabledelayedexpansion
cls

echo ======================================================================
echo    FLOWPULSE AI - BUILD & INSTALL NATIVE ANDROID APK TO PHONE
echo ======================================================================
echo.

cd /d "%~dp0..\..\mobile"
call node "build_and_install_loop.js"

echo.
pause
