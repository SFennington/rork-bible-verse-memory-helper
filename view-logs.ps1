#!/usr/bin/env pwsh
# Script to view React Native logs with filtering

Write-Host "Starting React Native log viewer..." -ForegroundColor Green
Write-Host "This will show console logs from your app." -ForegroundColor Green
Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow
Write-Host ""

# Run adb logcat and filter for React Native logs
adb logcat | Select-String -Pattern "ReactNativeJS" -CaseSensitive

