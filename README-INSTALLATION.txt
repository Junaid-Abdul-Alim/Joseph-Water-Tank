================================================================================
  WATER QUALITY MONITOR - IMPORTANT INSTALLATION NOTES
  Version 1.0.0 - Developed by Fluid Fusion Team · Dr. Vinod Kumar
================================================================================

📦 THIS PACKAGE CONTAINS PRE-BUILT APPLICATION
- The application is already compiled and ready to use
- You DO NOT need to build it again on the target computer
- Only Node.js runtime and server dependencies are required

================================================================================
  QUICK START - 3 SIMPLE STEPS
================================================================================

STEP 1: UNBLOCK THE FILES (Important for Windows Security)
   • Right-click the ZIP file BEFORE extracting
   • Select "Properties"
   • Check "Unblock" at the bottom
   • Click "Apply" then "OK"
   • Now extract the ZIP

STEP 2: RUN THE INSTALLER
   • Open the extracted "WaterQualityMonitor-Portable" folder
   • Double-click: UNBLOCK-AND-INSTALL.bat (Easiest!)
   • OR double-click: SIMPLE-INSTALL.bat (If above doesn't work)
   
STEP 3: CONFIGURE & LAUNCH
   • Edit bridge-server\.env with your TTN credentials
   • Double-click desktop shortcut to run

Total Time: 3-5 minutes

================================================================================
  WHAT GETS INSTALLED
================================================================================

The installation scripts will:
✓ Install Node.js dependencies for the bridge server ONLY
✓ Create desktop shortcut with custom icon  
✓ Create configuration file (.env)
✗ NO frontend dependencies (pre-built included)
✗ NO build step required (dist/ folder included)
✗ NO PowerShell signature needed (SIMPLE-INSTALL.bat available)

================================================================================
  INSTALLATION METHODS
================================================================================

METHOD 1 (Recommended): UNBLOCK-AND-INSTALL.bat
   - Automatically unblocks all files
   - Installs bridge server dependencies
   - Creates desktop shortcut
   - One-click solution!

METHOD 2 (No PowerShell): SIMPLE-INSTALL.bat
   - Uses only batch commands
   - No digital signature required
   - Works on any Windows system
   - Step-by-step instructions

METHOD 3 (Manual): For Complete Control
   1. Install Node.js from https://nodejs.org/
   2. Open terminal in this folder
   3. Run: cd bridge-server
   4. Run: npm install
   5. Run: cd ..
   6. Copy bridge-server\.env.example to .env
   7. Edit .env with credentials
   8. Run: launch-silent.vbs

================================================================================
  WHY NO BUILD STEP?
================================================================================

Traditional installation would require:
- Installing frontend dependencies (200+ MB)
- Installing build tools (Vite, Rollup, etc.)
- Running npm run build (compile source code)
- Total time: 10-15 minutes

Our optimized package:
- Pre-built dist/ folder included (production-ready)
- Only installs server dependencies (~15 MB)
- No build tools needed
- Total time: 3-5 minutes

This saves time and avoids build errors on different systems!

================================================================================
  PACKAGE CONTENTS
================================================================================

Pre-Built Application:
  dist/                    - Compiled React application (ready to use)
  electron/                - Desktop wrapper
  public/                  - Icons (PNG + ICO)
  
Server (needs installation):
  bridge-server/           - MQTT-HTTP bridge server
  bridge-server/.env.example - Configuration template
  
Launchers:
  launch-silent.vbs        - Silent launcher (no terminal)
  start-desktop.bat        - Desktop starter script
  
Installation Helpers:
  UNBLOCK-AND-INSTALL.bat  - Auto-unblock + install
  SIMPLE-INSTALL.bat       - No PowerShell installer
  auto-setup.bat           - Standard installer
  create-desktop-shortcut.ps1 - Shortcut creator
  recreate-desktop-shortcut.ps1 - Icon updater
  
Documentation:
  README-INSTALLATION.txt  - This file
  FIX-SECURITY-WARNING.txt - Security warning solutions
  USER_GUIDE.md            - Complete user guide
  README.md                - Project overview
  
Configuration:
  package.json             - Dependencies list
  vite.config.js           - Build configuration (reference only)

================================================================================
  SYSTEM REQUIREMENTS
================================================================================

✓ Windows 10 or 11 (64-bit recommended)
✓ Node.js 18.0.0 or higher
✓ 2GB RAM minimum
✓ 500 MB disk space
✓ Internet connection (for npm install and MQTT)

================================================================================
  TROUBLESHOOTING
================================================================================

ERROR: "Could not resolve entry module index.html"
CAUSE: Old installation script tried to build from source
FIX: Use the updated SIMPLE-INSTALL.bat or UNBLOCK-AND-INSTALL.bat

ERROR: "This file does not have a valid digital signature"
CAUSE: Windows security blocks unsigned files
FIX: See FIX-SECURITY-WARNING.txt for solutions

ERROR: "Node.js not found"
CAUSE: Node.js not installed or not in PATH
FIX: Install from https://nodejs.org/, restart computer

ERROR: "npm install failed"
CAUSE: Network issue or corrupted npm cache
FIX: 
  1. Check internet connection
  2. Run: npm cache clean --force
  3. Try installation again

ERROR: "Desktop shortcut not created"
CAUSE: PowerShell execution policy restriction
FIX: Use manual shortcut creation:
  1. Right-click launch-silent.vbs
  2. Create shortcut
  3. Move to desktop
  4. Rename to "Water Quality Monitor"

================================================================================
  VERIFICATION
================================================================================

After successful installation, verify:

✓ Desktop shortcut "Water Quality Monitor" exists
✓ Custom icon appears on the shortcut
✓ bridge-server/node_modules folder exists (~15 MB)
✓ bridge-server/.env file exists with your credentials
✓ Application launches without terminal window
✓ Header shows "FLUID FUSION" branding
✓ Footer shows "Developed by Fluid Fusion Team · Dr. Vinod Kumar"
✓ Version displayed: v1.0.0

================================================================================
  CONFIGURATION
================================================================================

Edit: bridge-server\.env

Required Settings:
```
TTN_MQTT_HOST=eu1.cloud.thethings.network
TTN_MQTT_PORT=8883
TTN_MQTT_USERNAME=your-application-id@ttn
TTN_MQTT_PASSWORD=NNSXS.YOUR.API.KEY.HERE
TTN_MQTT_TOPIC=v3/your-application-id@ttn/devices/+/up
TTN_DEVICE_ID=your-device-id
HTTP_PORT=3333
WS_PORT=3334
```

Get credentials from: https://console.cloud.thethings.network/

================================================================================
  RUNNING THE APPLICATION
================================================================================

Option 1: Desktop Shortcut (Recommended)
   - Double-click "Water Quality Monitor" on desktop
   - Application runs silently (no terminal window)

Option 2: Launcher Script
   - Double-click: launch-silent.vbs in the folder
   - Same as desktop shortcut

Option 3: Manual (for testing)
   - Double-click: start-desktop.bat
   - Terminal window will appear (useful for debugging)

================================================================================
  SUPPORT
================================================================================

For detailed help:
  1. Read USER_GUIDE.md (comprehensive guide)
  2. Read FIX-SECURITY-WARNING.txt (installation issues)
  3. Use SIMPLE-INSTALL.bat (if auto-setup fails)

Common Questions:
  Q: Can I move this folder after installation?
  A: Yes, but recreate the desktop shortcut after moving

  Q: How do I update the application?
  A: Replace the folder contents and run the installer again

  Q: Where is the database stored?
  A: bridge-server/database.db (created automatically)

  Q: How much data will be stored?
  A: ~1 MB per 10,000 readings (auto-cleanup after 180 days)

================================================================================

For additional support, refer to USER_GUIDE.md in this folder.

Developed by Fluid Fusion Team
Supervised by Dr. Vinod Kumar
Version: 1.0.0
March 2026

================================================================================
