@echo off
chcp 65001 >nul
title Mở trang Giáo viên

echo.
echo 🌐 Đang mở trang quản lý giáo viên...
echo.

start http://localhost:3000/teacher

timeout /t 2 >nul
