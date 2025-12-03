@echo off
chcp 65001 >nul
title 🎓 Server Trắc Nghiệm

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║   🎓 HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN                    ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Chuyển đến thư mục chứa file bat
cd /d "%~dp0"

:: Kiểm tra Node.js đã cài chưa
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Chưa cài đặt Node.js!
    echo.
    echo 📥 Vui lòng tải và cài đặt Node.js từ:
    echo    https://nodejs.org/
    echo.
    echo    Chọn phiên bản LTS ^(khuyên dùng^)
    echo.
    pause
    exit /b 1
)

echo ✓ Đã phát hiện Node.js
echo.

:: Kiểm tra đã cài đặt packages chưa
if not exist "node_modules" (
    echo 📦 Đang cài đặt các gói cần thiết lần đầu...
    echo    ^(Quá trình này chỉ chạy 1 lần^)
    echo.
    call npm install
    echo.
)

echo 🚀 Đang khởi động server...
echo.
echo ────────────────────────────────────────────────────────────────
echo.

:: Chạy server
node server.js

:: Nếu server dừng
echo.
echo ════════════════════════════════════════════════════════════════
echo    Server đã dừng. Nhấn phím bất kỳ để đóng cửa sổ này.
echo ════════════════════════════════════════════════════════════════
pause >nul
