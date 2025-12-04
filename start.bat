@echo off
title Server Trac Nghiem

echo.
echo ========================================
echo    HE THONG THI TRAC NGHIEM LAN
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Chua cai dat Node.js!
    echo Vui long tai va cai dat Node.js tu: https://nodejs.org/
    pause
    exit /b 1
)

echo Da phat hien Node.js

if not exist "node_modules" (
    echo Dang cai dat packages lan dau...
    call npm install
    echo.
)

echo Dang khoi dong server...
echo.

node server.js

echo.
echo Server da dung. Nhan phim bat ky de dong.
pause >nul
