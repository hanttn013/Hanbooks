@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577
set APK=E:\Personal_pj\Hanbook\aurelia-books\android\app\build\outputs\apk\debug\app-debug.apk

echo Killing old server...
"%ADB%" kill-server
timeout /t 2 /nobreak > nul

echo Starting server and connecting...
"%ADB%" start-server
timeout /t 2 /nobreak > nul

echo Connecting to device...
"%ADB%" connect %DEVICE%
timeout /t 2 /nobreak > nul

echo Devices:
"%ADB%" devices

echo.
echo Getting device info...
"%ADB%" -s %DEVICE% shell getprop ro.product.model
"%ADB%" -s %DEVICE% shell getprop ro.build.version.release

echo.
echo Installing APK...
"%ADB%" -s %DEVICE% install -r "%APK%"

echo.
echo Launching app...
"%ADB%" -s %DEVICE% shell am start -n com.aurelia.books.debug/.MainActivity

echo Done!
