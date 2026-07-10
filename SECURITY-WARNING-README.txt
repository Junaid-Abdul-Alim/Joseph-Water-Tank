================================================================================
WINDOWS SECURITY WARNING - QUICK FIX GUIDE
Water Quality Monitor v1.0.0
================================================================================

PROBLEM: "This file does not have a valid digital signature"

✅ SOLUTION PROVIDED - 3 Easy Methods

================================================================================
METHOD 1: EASIEST - AUTO-UNBLOCK (⭐ RECOMMENDED)
================================================================================

1. Extract the ZIP file completely first
2. Go into the extracted "WaterQualityMonitor-Portable" folder  
3. Double-click: UNBLOCK-AND-INSTALL.bat
4. This will:
   - Unblock all files automatically
   - Run the installation
   - Create desktop shortcut
5. Done!

================================================================================
METHOD 2: SIMPLE INSTALLER - NO POWERSHELL
================================================================================

If Method 1 doesn't work:

1. Extract the ZIP file
2. Go into the extracted folder
3. Double-click: SIMPLE-INSTALL.bat
4. Follow the on-screen instructions
5. This method:
   - Doesn't use PowerShell (no signature needed)
   - Works on all Windows systems
   - Safe to run anywhere

================================================================================
METHOD 3: MANUAL UNBLOCK BEFORE EXTRACTING
================================================================================

Prevent the issue entirely:

BEFORE extracting the ZIP:
1. Right-click on the ZIP file
2. Select "Properties"
3. At the bottom, check the "Unblock" box
4. Click "Apply" then "OK"
5. Now extract the ZIP file
6. All files inside will automatically be unblocked
7. Run auto-setup.bat normally

================================================================================
WHY THIS HAPPENS
================================================================================

- Windows blocks files from "unknown" sources for security
- Files downloaded or transferred show security warnings  
- Digital signatures cost $$$ (not feasible for small projects)
- This is SAFE software developed by Fluid Fusion Team
- The warning is normal and can be safely bypassed

================================================================================
FILES INCLUDED IN YOUR PACKAGE
================================================================================

✓ UNBLOCK-AND-INSTALL.bat      - Automatic unblock + install
✓ SIMPLE-INSTALL.bat            - No PowerShell required
✓ FIX-SECURITY-WARNING.txt      - Detailed instructions
✓ auto-setup.bat                - Standard auto-installer
✓ USER_GUIDE.md                 - Complete documentation

================================================================================
RECOMMENDED INSTALLATION STEPS
================================================================================

1. Right-click ZIP → Properties → Unblock → OK
2. Extract ZIP file to desired location
3. Run UNBLOCK-AND-INSTALL.bat
4. Configure TTN credentials (bridge-server\.env)
5. Launch from desktop shortcut

Total time: 5-7 minutes (includes dependency installation)

================================================================================
STILL BLOCKED? USE MANUAL INSTALLATION
================================================================================

If all scripts are blocked:

1. Install Node.js from https://nodejs.org/
2. Open folder in terminal (right-click → Open in Terminal)
3. Run: npm install
4. Run: cd bridge-server
5. Run: npm install
6. Run: cd ..
7. Run: npm run build
8. Double-click launch-silent.vbs to run

This method ALWAYS works - no scripts needed!

================================================================================
VERIFICATION
================================================================================

After installation, check:

✓ Desktop shortcut "Water Quality Monitor" exists
✓ Custom icon appears on shortcut
✓ Application launches without terminal
✓ Header shows "FLUID FUSION" branding
✓ Footer shows "...Dr. Vinod Kumar"
✓ Version: v1.0.0

================================================================================
SUPPORT
================================================================================

For detailed help:
- Read: FIX-SECURITY-WARNING.txt (detailed instructions)
- Read: USER_GUIDE.md (complete guide)
- Use: SIMPLE-INSTALL.bat (always works)

The portable folder "WaterQualityMonitor-Portable" contains everything needed.
You can copy this folder to USB/network share for transfer.

================================================================================
