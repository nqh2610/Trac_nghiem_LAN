@echo off
chcp 65001 >nul
title Cài đặt cho Windows 7 / Node 13

echo ========================================
echo   CAI DAT CHO WINDOWS 7 / NODE 13
echo ========================================
echo.

REM Backup package.json cũ
if exist package.json.bak (
    del package.json.bak
)
copy package.json package.json.bak

REM Dùng package cho Node 13
copy /Y package-node13.json package.json

echo Dang cai dat cac goi tuong thich voi Node 13...
echo.

REM Xóa node_modules cũ
if exist node_modules (
    echo Dang xoa node_modules cu...
    rmdir /s /q node_modules
)

REM Cài đặt lại
call npm install

echo.
echo ========================================
echo   CAI DAT HOAN TAT!
echo ========================================
echo.
echo Bay gio ban co the chay: start.bat
echo.
pause
