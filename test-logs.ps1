#!/usr/bin/env pwsh
# Quick test to verify logs are working

Write-Host "Testing log connection..." -ForegroundColor Cyan
Write-Host ""

# Check if adb is available
try {
    $adbVersion = adb version 2>&1 | Select-Object -First 1
    Write-Host "✓ ADB found: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ADB not found. Please install Android SDK Platform Tools." -ForegroundColor Red
    exit 1
}

# Check for connected devices
Write-Host ""
Write-Host "Checking for connected devices..." -ForegroundColor Cyan
$devices = adb devices | Select-String -Pattern "device$" | Measure-Object
if ($devices.Count -gt 0) {
    Write-Host "✓ Found $($devices.Count) device(s) connected" -ForegroundColor Green
    adb devices
} else {
    Write-Host "✗ No devices connected. Please connect your Android device or start an emulator." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Showing last 50 React Native log lines..." -ForegroundColor Cyan
Write-Host "If you see app logs below, everything is working!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray

# Show recent logs
adb logcat -t 50 | Select-String -Pattern "ReactNativeJS" -CaseSensitive

