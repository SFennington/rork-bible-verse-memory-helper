# Build, Reload, and Commit Script
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Starting build, reload, and commit process..." -ForegroundColor Cyan

$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "C:\Users\cfenn\AppData\Local\Android\Sdk"
$env:PATH += ";C:\Users\cfenn\AppData\Local\Android\Sdk\platform-tools"

Set-Location -Path "android"
Write-Host "Building APK..." -ForegroundColor Yellow

.\gradlew.bat assembleRelease -x lintVitalAnalyzeRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Installing on emulator..." -ForegroundColor Green
    Set-Location -Path ".."
    
    $devices = adb devices
    if ($devices -match "emulator-5554") {
        adb -s emulator-5554 install -r android\app\build\outputs\apk\release\app-release.apk
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "APK installed! Launching app..." -ForegroundColor Green
            adb -s emulator-5554 shell am start -n app.rork.heartscript/.MainActivity
            Write-Host "App launched on emulator!" -ForegroundColor Green
            
            Write-Host "Committing changes to GitHub..." -ForegroundColor Cyan
            git add -A
            $commitMessage = "Auto-build: Updated app - $timestamp"
            git commit -m $commitMessage
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
                git push origin main
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Changes committed and pushed to GitHub!" -ForegroundColor Green
                    Write-Host "Commit message: $commitMessage" -ForegroundColor Gray
                } else {
                    Write-Host "Push failed - you may need to pull first" -ForegroundColor Yellow
                }
            } else {
                Write-Host "No changes to commit" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Installation failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Emulator not running (emulator-5554 not found)" -ForegroundColor Yellow
    }
} else {
    Set-Location -Path ".."
    Write-Host "Build failed" -ForegroundColor Red
}

Write-Host "Process complete!" -ForegroundColor Cyan
