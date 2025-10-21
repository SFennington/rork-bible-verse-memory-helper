# Build Release and Copy to Google Drive
# This script builds both APK and AAB files and copies them to your Google Drive

Write-Host "Building Release APK and AAB for Google Drive..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$drivePath = "G:\My Drive\Business\Apps\Verse Memory"

# Stage and commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
$gitStatus = git status --short
if ($gitStatus) {
    $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Release build: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
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

# Navigate to android directory
Set-Location android

# Build APK
Write-Host "Building Release APK..." -ForegroundColor Yellow
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "APK build successful!" -ForegroundColor Green
Write-Host ""

# Build AAB
Write-Host "Building Release AAB (for Play Store)..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "AAB build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "AAB build successful!" -ForegroundColor Green
Write-Host ""

# Go back to root
Set-Location ..

# Create timestamped filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"

# Copy APK to Google Drive
Write-Host "Copying files to Google Drive..." -ForegroundColor Yellow
$apkSource = "android\app\build\outputs\apk\release\app-release.apk"
$aabSource = "android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $apkSource) {
    $apkDest = "$drivePath\HeartScript-$timestamp.apk"
    Copy-Item $apkSource -Destination $apkDest -Force
    Write-Host "Copied APK: HeartScript-$timestamp.apk" -ForegroundColor Green
} else {
    Write-Host "Warning: APK not found at $apkSource" -ForegroundColor Yellow
}

if (Test-Path $aabSource) {
    $aabDest = "$drivePath\HeartScript-$timestamp.aab"
    Copy-Item $aabSource -Destination $aabDest -Force
    Write-Host "Copied AAB: HeartScript-$timestamp.aab" -ForegroundColor Green
} else {
    Write-Host "Warning: AAB not found at $aabSource" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Build complete! Files saved to:" -ForegroundColor Cyan
Write-Host "  $drivePath" -ForegroundColor White
Write-Host ""
Write-Host "Ready for:" -ForegroundColor Green
Write-Host "  - APK: Direct installation on devices" -ForegroundColor White
Write-Host "  - AAB: Google Play Store submission" -ForegroundColor White
Write-Host ""

