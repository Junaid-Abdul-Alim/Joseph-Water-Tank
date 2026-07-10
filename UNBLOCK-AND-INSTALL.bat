@echo off
REM ============================================================================
REM  Water Quality Monitor - UNBLOCK FILES HELPER
REM  This script unblocks all files so they can run on Windows
REM ============================================================================

echo.
echo ============================================================================
echo   Unblocking Application Files
echo ============================================================================
echo.
echo This will allow the application to run on your computer.
echo.

REM Get current directory
set "APP_DIR=%~dp0"

echo Unblocking files in: %APP_DIR%
echo.

REM Unblock all PowerShell scripts
echo [1/3] Unblocking PowerShell scripts...
powershell -Command "Get-ChildItem -Path '%APP_DIR%' -Filter *.ps1 | Unblock-File" 2>nul
if %errorlevel% equ 0 (
    echo     Done!
) else (
    echo     Note: Some files may need manual unblocking
)

REM Unblock VBS files
echo [2/3] Unblocking VBScript files...
powershell -Command "Get-ChildItem -Path '%APP_DIR%' -Filter *.vbs | Unblock-File" 2>nul
if %errorlevel% equ 0 (
    echo     Done!
) else (
    echo     Note: Some files may need manual unblocking
)

REM Unblock batch files
echo [3/3] Unblocking batch files...
powershell -Command "Get-ChildItem -Path '%APP_DIR%' -Filter *.bat | Unblock-File" 2>nul
if %errorlevel% equ 0 (
    echo     Done!
) else (
    echo     Note: Some files may need manual unblocking
)

echo.
echo ============================================================================
echo   Files Unblocked Successfully!
echo ============================================================================
echo.
echo You can now run auto-setup.bat to install the application.
echo.
echo Press any key to run auto-setup.bat now...
pause >nul

REM Run auto-setup
call "%APP_DIR%auto-setup.bat"
