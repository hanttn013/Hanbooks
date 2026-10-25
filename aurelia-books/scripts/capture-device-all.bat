@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577
set OUT=qa\device-screenshots

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%

:: Open Library tab
echo Navigating to Library...
"%ADB%" -s %DEVICE% shell input tap 265 2340
timeout /t 1 /nobreak > nul

:: Screenshot Library
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/screen5-library.png
"%ADB%" -s %DEVICE% pull /sdcard/screen5-library.png %OUT%\screen5-library.png
"%ADB%" -s %DEVICE% shell rm /sdcard/screen5-library.png
echo screen5-library.png saved

:: Tap first book in library (book info button)
echo Opening book info...
"%ADB%" -s %DEVICE% shell input tap 540 500
timeout /t 2 /nobreak > nul

"%ADB%" -s %DEVICE% shell screencap -p /sdcard/screen6-book-detail.png
"%ADB%" -s %DEVICE% pull /sdcard/screen6-book-detail.png %OUT%\screen6-book-detail.png
"%ADB%" -s %DEVICE% shell rm /sdcard/screen6-book-detail.png
echo screen6-book-detail.png saved

:: Tap Đọc button to open reader
echo Tapping Read button...
"%ADB%" -s %DEVICE% shell input tap 540 2200
timeout /t 8 /nobreak > nul

:: Screenshot reader loading/content
"%ADB%" -s %DEVICE% shell screencap -p /sdcard/screen7-reader.png
"%ADB%" -s %DEVICE% pull /sdcard/screen7-reader.png %OUT%\screen7-reader.png
"%ADB%" -s %DEVICE% shell rm /sdcard/screen7-reader.png
echo screen7-reader.png saved

:: Tap to show controls
"%ADB%" -s %DEVICE% shell input tap 540 1200
timeout /t 1 /nobreak > nul

"%ADB%" -s %DEVICE% shell screencap -p /sdcard/screen8-reader-chrome.png
"%ADB%" -s %DEVICE% pull /sdcard/screen8-reader-chrome.png %OUT%\screen8-reader-chrome.png
"%ADB%" -s %DEVICE% shell rm /sdcard/screen8-reader-chrome.png
echo screen8-reader-chrome.png saved

echo All done!
