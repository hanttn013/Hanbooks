@echo off
set ADB=E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe
set DEVICE=192.168.1.80:45577

"%ADB%" kill-server 2>nul
"%ADB%" connect %DEVICE%
"%ADB%" -s %DEVICE% shell monkey -p com.aurelia.books.debug -c android.intent.category.LAUNCHER 1
