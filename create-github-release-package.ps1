param(
    [string]$Version,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoOwner = "Junaid-Abdul-Alim"
$repoName = "Joseph-Water-Tank"
$assetName = "WaterQualityMonitor-CollegePortable.zip"

if ($Version) {
    Write-Host "Setting app version to $Version..." -ForegroundColor Yellow
    npm pkg set "version=$Version"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update package version"
    }

    npm install --package-lock-only --ignore-scripts
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update package-lock version"
    }
}

$packageJson = Get-Content -LiteralPath (Join-Path $PSScriptRoot "package.json") -Raw | ConvertFrom-Json
$tag = "v$($packageJson.version)"

Write-Host ""
Write-Host "Building GitHub Release package for $tag..." -ForegroundColor Cyan

$buildArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $PSScriptRoot "create-college-portable.ps1"),
    "-OutputName", "WaterQualityMonitor-CollegePortable"
)

if ($SkipBuild) {
    $buildArgs += "-SkipBuild"
}

powershell @buildArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to build portable package"
}

$zipPath = Join-Path $PSScriptRoot $assetName
$instructionsPath = Join-Path $PSScriptRoot "GITHUB-RELEASE-UPLOAD.txt"
$releaseUrl = "https://github.com/$repoOwner/$repoName/releases/new?tag=$tag&title=$tag"

@"
GITHUB RELEASE UPLOAD
=====================

Repository:
https://github.com/$repoOwner/$repoName

Release tag:
$tag

Upload this asset:
$zipPath

Important:
- This ZIP is built without bridge-server\.env, so it is safe to upload.
- Do not upload any ZIP created with -IncludePrivateEnv.
- Every update must use a higher package.json version than the installed app.
- The app updater expects the asset name to be exactly:
  $assetName

Create the release here:
$releaseUrl
"@ | Set-Content -Path $instructionsPath -Encoding ascii

Write-Host ""
Write-Host "GitHub release package ready:" -ForegroundColor Green
Write-Host $zipPath
Write-Host ""
Write-Host "Upload instructions:" -ForegroundColor Green
Write-Host $instructionsPath
Write-Host ""
Write-Host "Release page:" -ForegroundColor Cyan
Write-Host $releaseUrl
