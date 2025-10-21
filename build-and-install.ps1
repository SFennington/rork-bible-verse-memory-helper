# Build and Install Script for Android
# This ensures you always have the latest code running on your emulator

Write-Host "🚀 Building and Installing Latest Version..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Navigate to android directory and build
Write-Host "📦 Building APK with latest changes..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Install to emulator
Write-Host ""
Write-Host "📲 Installing to emulator..." -ForegroundColor Yellow
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r android\app\build\outputs\apk\release\app-release.apk

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    exit 1
}

# Launch the app
Write-Host ""
Write-Host "🎉 Launching app..." -ForegroundColor Yellow
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell am start -n app.rork.heartscript/.MainActivity

Write-Host ""
Write-Host "✅ Done! Your emulator now has the latest version!" -ForegroundColor Green
Write-Host ""

