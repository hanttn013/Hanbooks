@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577
set OUT=qa\device-screenshots

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%

:: Get screen size first
echo Getting screen size...
"%ADB%" -s %DEVICE% shell wm size

:: Back to Home screen, kill app first and restart
echo Restarting app...
"%ADB%" -s %DEVICE% shell am force-stop com.aurelia.books.debug
timeout /t 1 /nobreak > nul
"%ADB%" -s %DEVICE% shell monkey -p com.aurelia.books.debug -c android.intent.category.LAUNCHER 1
timeout /t 3 /nobreak > nul

echo Taking home screenshot...
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/s1-home.png
"%ADB%" -s %DEVICE% pull /sdcard/s1-home.png %OUT%\s1-home.png
"%ADB%" -s %DEVICE% shell rm /sdcard/s1-home.png

echo Done!
