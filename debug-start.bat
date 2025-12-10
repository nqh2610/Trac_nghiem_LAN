@echo off
chcp 65001 >nul
title Debug Server Node 13
cd /d "%~dp0"

echo.
echo ========================================
echo    DEBUG SERVER - TIM LOI NODE 13
echo ========================================
echo.
echo Node version:
node --version
echo.

echo Chay server voi debug output...
echo.
echo ----------------------------------------
echo.

node --stack-trace-limit=50 server.js 2>&1

echo.
echo ----------------------------------------
echo.
echo Ma thoat: %ERRORLEVEL%
echo.
pause
