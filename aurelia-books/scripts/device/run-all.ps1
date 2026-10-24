# scripts/device/run-all.ps1
param (
  [string]$Device = "192.168.1.80:34961"
)

$ErrorActionPreference = "Stop"
$Adb = "E:\Personal_pj\Hanbook\.android-sdk\platform-tools\adb.exe"

Write-Host ">>> 1. Kết nối ADB tới thiết bị: $Device" -ForegroundColor Cyan
& $Adb connect $Device

Write-Host ">>> 2. Xây dựng gói web và đồng bộ Capacitor" -ForegroundColor Cyan
npm run build
npx cap sync android

Write-Host ">>> 3. Biên dịch APK debug với Gradle" -ForegroundColor Cyan
$env:JAVA_HOME = "e:\Personal_pj\Hanbook\.jdk\jdk-21.0.11+10"
$env:ANDROID_HOME = "e:\Personal_pj\Hanbook\.android-sdk"
cmd /c "cd android && gradlew.bat assembleDebug"

Write-Host ">>> 4. Cài đặt bản debug (com.aurelia.books.debug) lên thiết bị" -ForegroundColor Cyan
& $Adb -s $Device install -r android/app/build/outputs/apk/debug/app-debug.apk

Write-Host ">>> 5. Sinh fixtures lớn kiểm thử hiệu năng" -ForegroundColor Cyan
node scripts/device/generate-large-fixtures.mjs

Write-Host ">>> 6. Chạy toàn bộ kịch bản kiểm thử hiệu năng và độ ổn định (Phase 4)" -ForegroundColor Cyan
node scripts/device/test-phase4-scenarios.mjs

Write-Host ">>> HOÀN THÀNH TOÀN BỘ KỊCH BẢN PHASE 4!" -ForegroundColor Green
