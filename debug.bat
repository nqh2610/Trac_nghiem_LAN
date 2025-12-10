@echo off
chcp 65001 >nul 2>nul
title Debug - Trac Nghiem LAN

echo.
echo ========================================
echo    DEBUG - TIM LOI TRAC NGHIEM LAN
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Kiem tra Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Node.js khong hoat dong!
    goto :end
)
echo OK
echo.

echo [2] Kiem tra npm...
call npm --version
if %ERRORLEVEL% NEQ 0 (
    echo LOI: npm khong hoat dong!
    goto :end
)
echo OK
echo.

echo [3] Kiem tra thu muc hien tai...
echo %cd%
if not exist "server.js" (
    echo LOI: Khong tim thay server.js!
    goto :end
)
echo OK - Tim thay server.js
echo.

echo [4] Kiem tra cu phap server.js...
node -c server.js
if %ERRORLEVEL% NEQ 0 (
    echo LOI: File server.js co loi cu phap!
    goto :end
)
echo OK
echo.

echo [5] Kiem tra license-manager.js...
node -c license\license-manager.js
if %ERRORLEVEL% NEQ 0 (
    echo LOI: File license-manager.js co loi!
    goto :end
)
echo OK
echo.

echo [6] Kiem tra update-manager.js...
node -c license\update-manager.js
if %ERRORLEVEL% NEQ 0 (
    echo LOI: File update-manager.js co loi!
    goto :end
)
echo OK
echo.

echo [7] Kiem tra node_modules...
if not exist "node_modules" (
    echo Chua co node_modules, dang cai dat...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo LOI: Khong the cai dat packages!
        goto :end
    )
)
echo OK
echo.

echo [8] Chay kiem tra tuong thich...
node test-compat.js
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Kiem tra tuong thich that bai!
    goto :end
)
echo.

echo [9] Thu khoi dong server (30 giay)...
echo Nhan Ctrl+C de dung...
echo.
node server.js

:end
echo.
echo ========================================
echo Nhan phim bat ky de dong...
pause >nul
