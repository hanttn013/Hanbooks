@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577
set OUT=qa\fix\before

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%

:: Tap on Settings tab (Tab 4, bottom right ~x=860, y=2380 on 1080x2460)
echo Tapping Settings tab...
"%ADB%" -s %DEVICE% shell input tap 945 2380
timeout /t 2 /nobreak > nul

:: Swipe down to scroll to the very bottom of Settings
echo Scrolling to bottom of Settings...
"%ADB%" -s %DEVICE% shell input swipe 540 1800 540 300 300
timeout /t 1 /nobreak > nul
"%ADB%" -s %DEVICE% shell input swipe 540 1800 540 300 300
timeout /t 1 /nobreak > nul

echo Capturing device settings bottom...
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/device-settings-bottom.png
"%ADB%" -s %DEVICE% pull /sdcard/device-settings-bottom.png %OUT%\device-settings-bottom.png
"%ADB%" -s %DEVICE% shell rm /sdcard/device-settings-bottom.png
echo device-settings-bottom.png saved
