# Build and Install Script for Android
# This ensures you always have the latest code running on your emulator

Write-Host "Building and Installing Latest Version..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Stage and commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
$gitStatus = git status --short
if ($gitStatus) {
    $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    git commit -m $commitMessage
    Write-Host "Changes committed" -ForegroundColor Green
    
    # Push to remote
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pushed to remote" -ForegroundColor Green
    } else {
        Write-Host "Failed to push (check your connection or credentials)" -ForegroundColor Yellow
    }
} else {
    Write-Host "No changes to commit" -ForegroundColor Cyan
}
Write-Host ""

# Navigate to android directory and build
Write-Host "Building APK with latest changes..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Install to emulator
Write-Host ""
Write-Host "Installing to emulator..." -ForegroundColor Yellow
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r android\app\build\outputs\apk\release\app-release.apk

if ($LASTEXITCODE -ne 0) {
    Write-Host "Installation failed!" -ForegroundColor Red
    exit 1
}

# Launch the app
Write-Host ""
Write-Host "Launching app..." -ForegroundColor Yellow
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell am start -n app.rork.heartscript/.MainActivity

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Done! Your emulator now has the latest version running!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "App installed but failed to launch automatically. Please launch manually." -ForegroundColor Yellow
    Write-Host ""
}
