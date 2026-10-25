@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577
set OUT=qa\device-screenshots

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%

:: Wait for app to fully load
timeout /t 5 /nobreak > nul

echo Taking home screenshot (after load)...
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/s1-home-loaded.png
"%ADB%" -s %DEVICE% pull /sdcard/s1-home-loaded.png %OUT%\s1-home-loaded.png
"%ADB%" -s %DEVICE% shell rm /sdcard/s1-home-loaded.png

echo Home screenshot done!

:: Tap on first recommended book cover (Pride and Prejudice)
:: Screen 1080x2460, book grid x~162, y~835
echo Tapping first recommended book...
"%ADB%" -s %DEVICE% shell input tap 162 835
timeout /t 2 /nobreak > nul

"%ADB%" -s %DEVICE% shell screencap -p /sdcard/s2-detail.png
"%ADB%" -s %DEVICE% pull /sdcard/s2-detail.png %OUT%\s2-detail.png
"%ADB%" -s %DEVICE% shell rm /sdcard/s2-detail.png
echo Book detail screenshot done!

:: Tap Đọc (Read) button - bottom of screen ~y=2200
echo Tapping Read button...
"%ADB%" -s %DEVICE% shell input tap 540 2200
timeout /t 8 /nobreak > nul

"%ADB%" -s %DEVICE% shell screencap -p /sdcard/s3-reader.png
"%ADB%" -s %DEVICE% pull /sdcard/s3-reader.png %OUT%\s3-reader.png
"%ADB%" -s %DEVICE% shell rm /sdcard/s3-reader.png
echo Reader screenshot done!

:: Tap center to toggle controls
"%ADB%" -s %DEVICE% shell input tap 540 1200
timeout /t 1 /nobreak > nul

"%ADB%" -s %DEVICE% shell screencap -p /sdcard/s4-reader-ui.png
"%ADB%" -s %DEVICE% pull /sdcard/s4-reader-ui.png %OUT%\s4-reader-ui.png
"%ADB%" -s %DEVICE% shell rm /sdcard/s4-reader-ui.png
echo Reader+UI screenshot done!

echo === All screenshots saved to %OUT% ===
