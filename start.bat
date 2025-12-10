@echo off
chcp 65001 >nul 2>nul
title Trac Nghiem LAN

echo.
echo ========================================
echo    TRAC NGHIEM LAN - He thong thi
echo ========================================
echo.

cd /d "%~dp0"

echo Thu muc hien tai: %cd%
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Chua cai dat Node.js!
    echo Vui long tai va cai dat Node.js tu: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Kiem tra Node.js...
node --version
echo.

if not exist "node_modules" (
    echo Dang cai dat packages lan dau...
    echo Vui long cho...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo LOI: Khong the cai dat packages!
        pause
        exit /b 1
    )
    echo.
)

echo Dang khoi dong server...
echo.

node server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo LOI: Server gap loi!
    echo Ma loi: %ERRORLEVEL%
    echo ========================================
)

echo.
echo Server da dung. Nhan phim bat ky de dong.
pause >nul
