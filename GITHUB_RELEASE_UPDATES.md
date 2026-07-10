# GitHub Release Updates

Use GitHub Releases for updates after the app is already installed on each computer.

## First install

For a private USB/LAN first install that includes the TTN config, build:

```powershell
powershell -ExecutionPolicy Bypass -File ".\create-college-portable.ps1" -IncludePrivateEnv
```

Do not upload that ZIP to GitHub.

## Public update ZIP

For GitHub Releases, build the safe ZIP:

```powershell
npm run release:github -- -Version 1.0.1
```

This creates `WaterQualityMonitor-CollegePortable.zip` without `bridge-server\.env`.

## Publish

1. Push the code/version changes to GitHub.
2. Open GitHub Releases for `Junaid-Abdul-Alim/Joseph-Water-Tank`.
3. Create a release tag matching the app version, for example `v1.0.1`.
4. Upload the asset named exactly `WaterQualityMonitor-CollegePortable.zip`.
5. Publish the release.

The installed desktop app can then use `Check Updates` to download, apply, and restart.
