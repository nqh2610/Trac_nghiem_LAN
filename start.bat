@echo off
chcp 65001 >nul 2>nul
title Trac Nghiem LAN

echo.
echo ========================================
echo    TRAC NGHIEM LAN - He thong thi
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Chua cai dat Node.js!
    echo Vui long tai va cai dat Node.js tu: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Kiem tra cu phap truoc khi chay
node -c server.js >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo LOI: File server.js co loi cu phap!
    node -c server.js
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Dang cai dat packages lan dau...
    call npm install >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo LOI: Khong the cai dat packages!
        pause
        exit /b 1
    )
)

echo Dang khoi dong server...
echo.

node server.js

echo.
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Server gap loi! Ma loi: %ERRORLEVEL%
) else (
    echo Server da dung.
)
echo.
pause >nul
