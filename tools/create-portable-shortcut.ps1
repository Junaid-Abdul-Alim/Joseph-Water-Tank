param(
    [string]$InstallDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

$install = (Resolve-Path -LiteralPath $InstallDir.Trim('"')).Path
$target = Join-Path $install "Water Quality Monitor.exe"

if (-not (Test-Path -LiteralPath $target)) {
    throw "Water Quality Monitor.exe was not found in: $install"
}

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Water Quality Monitor.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $install
$shortcut.IconLocation = $target
$shortcut.Description = "Launch Water Quality Monitor"
$shortcut.Save()

Write-Host "Desktop shortcut created:"
Write-Host $shortcutPath
