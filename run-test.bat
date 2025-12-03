@echo off
cd /d "c:\Users\hungn\OneDrive\Máy tính\Trac_Nghiem"
echo Waiting for server...
timeout /t 3 /nobreak
node test-shuffle-grading.js
pause
