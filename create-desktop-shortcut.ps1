# Create Desktop Shortcut for Water Quality Monitor
# This script creates a shortcut on your desktop that launches the application

$AppPath = $PSScriptRoot
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Water Quality Monitor.lnk"

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $AppPath "launch-silent.vbs"
$Shortcut.WorkingDirectory = $AppPath
$Shortcut.Description = "Launch Water Quality Monitor Desktop Application"

# Try to set icon if it exists
$IconPath = Join-Path $AppPath "public\icon.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}

# Save the shortcut
$Shortcut.Save()

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Desktop Shortcut Created!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  1. Double-click 'Water Quality Monitor' on your desktop" -ForegroundColor White
Write-Host "  2. The application will start automatically" -ForegroundColor White
Write-Host "  3. Browser will open with the dashboard" -ForegroundColor White
Write-Host ""
Write-Host "The shortcut is ready to use!" -ForegroundColor Green
Write-Host ""

# Open Desktop folder to show the shortcut
Start-Process explorer.exe $DesktopPath
