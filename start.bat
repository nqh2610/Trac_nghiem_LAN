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
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo Node.js version: %NODE_VER%
echo.

REM Kiem tra cu phap truoc khi chay
echo Kiem tra file server.js...
node -c server.js >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo LOI: File server.js co loi cu phap!
    echo Chi tiet:
    node -c server.js
    echo.
    pause
    exit /b 1
)
echo OK - Cu phap hop le
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

REM Chay kiem tra tuong thich neu co loi truoc do
if exist "test-compat.js" (
    echo Chay kiem tra tuong thich...
    node test-compat.js
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo LOI: Kiem tra tuong thich that bai!
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo Dang khoi dong server...
echo.
echo (Neu khong thay link, hay cho vai giay...)
echo.

node server.js

echo.
echo ========================================
if %ERRORLEVEL% NEQ 0 (
    echo LOI: Server gap loi! Ma loi: %ERRORLEVEL%
) else (
    echo Server da dung binh thuong.
)
echo ========================================
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
