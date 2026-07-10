# Force Recreate Desktop Shortcut with ICO Icon
# This script deletes the old shortcut and creates a fresh one with the ICO icon

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Water Quality Monitor.lnk"
$iconIcoPath = Join-Path $PSScriptRoot "public\icon.ico"
$vbsPath = Join-Path $PSScriptRoot "launch-silent.vbs"

Write-Host "Recreating desktop shortcut with ICO icon..." -ForegroundColor Cyan
Write-Host ""

# Delete old shortcut if it exists
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Removed old shortcut" -ForegroundColor Yellow
}

# Verify ICO file exists
if (-not (Test-Path $iconIcoPath)) {
    Write-Host "ERROR: icon.ico not found at: $iconIcoPath" -ForegroundColor Red
    exit 1
}

# Create new shortcut with ICO icon
$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $vbsPath
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.IconLocation = $iconIcoPath
$shortcut.Description = "Water Quality Monitor - Real-time RO system monitoring by Fluid Fusion"
$shortcut.Save()

Write-Host "Created new desktop shortcut" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcut: $shortcutPath" -ForegroundColor Cyan
Write-Host "Icon: $iconIcoPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now refreshing Windows icon cache..." -ForegroundColor Yellow

# Clear Windows icon cache to force refresh
$iconCachePath = "$env:LOCALAPPDATA\IconCache.db"
if (Test-Path $iconCachePath) {
    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Remove-Item $iconCachePath -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Start-Process explorer
    Write-Host "Icon cache cleared and Explorer restarted" -ForegroundColor Green
} else {
    Write-Host "Icon cache file not found, skipping cache clear" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DONE! Your desktop icon should now appear." -ForegroundColor Green
Write-Host "If it still does not show, try:" -ForegroundColor Yellow
Write-Host "  1. Press F5 on desktop" -ForegroundColor Yellow
Write-Host "  2. Restart your computer" -ForegroundColor Yellow
