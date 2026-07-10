param(
    [string]$OutputName = "WaterQualityMonitor-CollegePortable",
    [switch]$SkipBuild,
    [switch]$IncludePrivateEnv
)

$ErrorActionPreference = "Stop"

function Remove-InWorkspace {
    param([string]$PathToRemove)

    if (-not (Test-Path $PathToRemove)) {
        return
    }

    $workspace = (Resolve-Path $PSScriptRoot).Path
    $resolved = (Resolve-Path $PathToRemove).Path

    if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove path outside workspace: $resolved"
    }

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop
            return
        } catch {
            if ($attempt -eq 5) {
                throw
            }

            Write-Host "  Waiting for file lock to clear: $resolved" -ForegroundColor DarkYellow
            Get-CimInstance Win32_Process |
                Where-Object { $_.Name -eq "Water Quality Monitor.exe" } |
                ForEach-Object {
                    try {
                        Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
                    } catch {}
                }
            Start-Sleep -Milliseconds (750 * $attempt)
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Building College Portable Package" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping any running app processes..." -ForegroundColor Yellow
Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -eq "Water Quality Monitor.exe" -or
        $_.CommandLine -like "*$PSScriptRoot*"
    } |
    Where-Object { $_.ProcessId -ne $PID } |
    ForEach-Object {
        try {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
            Write-Host "  Stopped PID $($_.ProcessId) $($_.Name)" -ForegroundColor Gray
        } catch {
            Write-Host "  Could not stop PID $($_.ProcessId)" -ForegroundColor DarkYellow
        }
    }

Write-Host ""
Write-Host "[2/5] Building desktop app..." -ForegroundColor Yellow
if (-not $SkipBuild) {
    Remove-InWorkspace (Join-Path $PSScriptRoot "release")
    npm run electron:build
    if ($LASTEXITCODE -ne 0) {
        throw "Electron build failed"
    }
} else {
    Write-Host "  Skipped build by request" -ForegroundColor Gray
}

$sourceDir = Join-Path $PSScriptRoot "release\win-unpacked"
if (-not (Test-Path $sourceDir)) {
    throw "Packaged app not found: $sourceDir"
}

$packageDir = Join-Path $PSScriptRoot $OutputName
$zipPath = Join-Path $PSScriptRoot "$OutputName.zip"

Write-Host ""
Write-Host "[3/5] Creating portable folder..." -ForegroundColor Yellow
Remove-InWorkspace $packageDir
Remove-InWorkspace $zipPath
Copy-Item -LiteralPath $sourceDir -Destination $packageDir -Recurse -Force

$externalConfigDir = Join-Path $packageDir "bridge-server"
New-Item -ItemType Directory -Path $externalConfigDir -Force | Out-Null

if ($IncludePrivateEnv -and (Test-Path (Join-Path $PSScriptRoot "bridge-server\.env"))) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "bridge-server\.env") -Destination (Join-Path $externalConfigDir ".env") -Force
    Write-Host "  Included private TTN .env for this deployment" -ForegroundColor Yellow
} else {
    Write-Host "  Private TTN .env was not included" -ForegroundColor Gray
}

if (Test-Path (Join-Path $PSScriptRoot "bridge-server\.env.example")) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "bridge-server\.env.example") -Destination (Join-Path $externalConfigDir ".env.example") -Force
}

@"
@echo off
cd /d "%~dp0"
start "" "Water Quality Monitor.exe"
"@ | Set-Content -Path (Join-Path $packageDir "RUN-WATER-QUALITY-MONITOR.bat") -Encoding ascii

@"
@echo off
setlocal
echo ============================================
echo  Water Quality Monitor - Update From ZIP
echo ============================================
echo.
echo Drag the newest $OutputName.zip file onto this window,
echo or paste its full path below.
echo.
set /p ZIP_PATH=Update ZIP path: 
if "%ZIP_PATH%"=="" (
  echo No ZIP path provided.
  pause
  exit /b 1
)
set "ZIP_PATH=%ZIP_PATH:"=%"
powershell -ExecutionPolicy Bypass -File "%~dp0tools\apply-portable-update.ps1" -PackagePath "%ZIP_PATH%" -InstallDir "%~dp0"
pause
"@ | Set-Content -Path (Join-Path $packageDir "UPDATE-FROM-ZIP.bat") -Encoding ascii

@"
@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0tools\create-portable-shortcut.ps1" -InstallDir "%~dp0"
pause
"@ | Set-Content -Path (Join-Path $packageDir "CREATE-DESKTOP-SHORTCUT.bat") -Encoding ascii

$toolsDir = Join-Path $packageDir "tools"
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "tools\apply-portable-update.ps1") -Destination $toolsDir -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "tools\create-portable-shortcut.ps1") -Destination $toolsDir -Force

@"
WATER QUALITY MONITOR - COLLEGE PORTABLE PACKAGE
================================================

Use this package on the college computer instead of the installer.

Why:
- No Node.js install is required.
- No npm install is required.
- The bridge server runs using the bundled Electron runtime.
- Your config and readings are stored in Windows AppData, so updates can replace this folder safely.

First install:
1. Extract this ZIP to a normal folder, for example:
   C:\WaterQualityMonitor
2. Open the extracted folder.
3. Run CREATE-DESKTOP-SHORTCUT.bat.
4. Double-click Water Quality Monitor on the desktop.

Updating later:
1. Build a fresh ZIP on the laptop using create-college-portable.ps1.
2. Copy the new ZIP to the college computer.
3. In the existing college app folder, run UPDATE-FROM-ZIP.bat.
4. Paste or drag the new ZIP path when asked.

Important:
- Windows may still show Unknown Publisher or SmartScreen warnings because this app is not signed with a purchased trusted code-signing certificate.
- If Windows blocks the ZIP, right-click the ZIP, open Properties, click Unblock, then extract again.
- If the college computer policy blocks all unsigned EXE files, no script can bypass that; the college IT admin must allow/sign the app.
"@ | Set-Content -Path (Join-Path $packageDir "README-COLLEGE-INSTALL.txt") -Encoding ascii

Write-Host ""
Write-Host "[4/5] Creating ZIP..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "[5/5] Package ready" -ForegroundColor Green
Write-Host "Folder: $packageDir" -ForegroundColor White
Write-Host "ZIP:    $zipPath" -ForegroundColor White
Write-Host "Size:   $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""
