@echo off
chcp 65001 >nul
title Dừng Server Trắc Nghiệm

echo.
echo 🛑 Đang dừng server trắc nghiệm...
echo.

taskkill /F /IM node.exe >nul 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✓ Đã dừng server thành công!
) else (
    echo ⚠ Không có server nào đang chạy.
)

echo.
timeout /t 3 >nul
