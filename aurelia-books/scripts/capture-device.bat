@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%

echo.
echo --- Screenshot 1: Home Screen (5 seconds after launch) ---
timeout /t 5 /nobreak > nul
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/screen1-home.png
"%ADB%" -s %DEVICE% pull /sdcard/screen1-home.png qa\device-screenshots\screen1-home.png
"%ADB%" -s %DEVICE% shell rm /sdcard/screen1-home.png

echo Done - screen1-home.png saved
