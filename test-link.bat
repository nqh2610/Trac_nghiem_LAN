@echo off
chcp 65001 >nul
title Test Hien Thi Link
cd /d "%~dp0"

echo.
echo ========================================
echo    TEST HIEN THI LINK
echo ========================================
echo.

node -e "var os = require('os'); var interfaces = os.networkInterfaces(); var ip = '127.0.0.1'; var keys = Object.keys(interfaces); for (var i = 0; i < keys.length; i++) { var ifaces = interfaces[keys[i]]; for (var j = 0; j < ifaces.length; j++) { if (ifaces[j].family === 'IPv4' && !ifaces[j].internal) { ip = ifaces[j].address; break; } } } console.log(''); console.log('Ten may: ' + os.hostname()); console.log('Dia chi IP: ' + ip); console.log(''); console.log('Link giao vien:'); console.log('  http://localhost:3456/teacher'); console.log(''); console.log('Link hoc sinh:'); console.log('  http://' + os.hostname() + ':3456'); console.log('  http://' + ip + ':3456'); console.log('');"

echo.
echo ========================================
echo.
pause
