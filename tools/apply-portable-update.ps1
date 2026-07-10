param(
    [Parameter(Mandatory = $true)]
    [string]$PackagePath,

    [Parameter(Mandatory = $true)]
    [string]$InstallDir,

    [int]$StartDelaySeconds = 0,

    [switch]$Restart
)

$ErrorActionPreference = "Stop"

$PackagePath = $PackagePath.Trim('"')
$InstallDir = $InstallDir.Trim('"')

if (-not (Test-Path -LiteralPath $PackagePath)) {
    throw "Update ZIP not found: $PackagePath"
}

if (-not (Test-Path -LiteralPath $InstallDir)) {
    throw "Install folder not found: $InstallDir"
}

$package = (Resolve-Path -LiteralPath $PackagePath).Path
$install = (Resolve-Path -LiteralPath $InstallDir).Path
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("wqm-update-" + [guid]::NewGuid().ToString("N"))
$envBackup = Join-Path ([System.IO.Path]::GetTempPath()) ("wqm-env-" + [guid]::NewGuid().ToString("N") + ".env")
$externalEnv = Join-Path $install "bridge-server\.env"
$appExe = Join-Path $install "Water Quality Monitor.exe"

if ($StartDelaySeconds -gt 0) {
    Start-Sleep -Seconds $StartDelaySeconds
}

Write-Host "Stopping Water Quality Monitor..."
Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "Water Quality Monitor.exe" } |
    ForEach-Object {
        try {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
        } catch {}
    }

if (Test-Path $externalEnv) {
    Copy-Item -LiteralPath $externalEnv -Destination $envBackup -Force
}

New-Item -ItemType Directory -Path $temp -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($package, $temp)

$source = $temp
$nested = Get-ChildItem -LiteralPath $temp -Directory | Where-Object { Test-Path (Join-Path $_.FullName "Water Quality Monitor.exe") } | Select-Object -First 1
if ($nested) {
    $source = $nested.FullName
}

if (-not (Test-Path (Join-Path $source "Water Quality Monitor.exe"))) {
    throw "Update ZIP does not contain Water Quality Monitor.exe"
}

Write-Host "Copying update files..."
Get-ChildItem -LiteralPath $source -Force |
    Copy-Item -Destination $install -Recurse -Force

if (Test-Path $envBackup) {
    New-Item -ItemType Directory -Path (Split-Path $externalEnv -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $envBackup -Destination $externalEnv -Force
}

Remove-Item -LiteralPath $temp -Recurse -Force
Remove-Item -LiteralPath $envBackup -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Update complete. Start Water Quality Monitor again."

if ($Restart) {
    Start-Process -FilePath $appExe -WorkingDirectory $install
}
