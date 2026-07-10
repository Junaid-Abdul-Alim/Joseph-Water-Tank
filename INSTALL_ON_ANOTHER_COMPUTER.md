================================================================================
  WATER QUALITY MONITOR - INSTALLATION GUIDE FOR ANOTHER COMPUTER
================================================================================

✅ CLEANED & READY FOR DEPLOYMENT

The software has been cleaned and is ready to install on another computer.
The portable package folder "WaterQualityMonitor-Portable" contains everything needed.

================================================================================
  METHOD 1: USB DRIVE TRANSFER (Recommended for Local Transfer)
================================================================================

1. PREPARE THE PACKAGE
   --------------------
   • Copy the entire "WaterQualityMonitor-Portable" folder to a USB drive
   • OR create a ZIP file:
     Right-click folder → Send to → Compressed (zipped) folder

2. ON THE NEW COMPUTER
   -------------------
   Step 1: Copy folder from USB to any location (e.g., Desktop or C:\Apps)
   
   Step 2: Install Node.js
      • Download from: https://nodejs.org/
      • Install LTS version (v18 or higher)
      • Accept all defaults during installation
   
   Step 3: Run Auto-Setup (EASIEST METHOD)
      • Navigate to the WaterQualityMonitor-Portable folder
      • Double-click "auto-setup.bat"
      • Wait 3-5 minutes for dependencies to install
      • Desktop shortcut will be created automatically
   
   Step 4: Configure TTN Credentials
      • Open: bridge-server\.env file (notepad will open automatically)
      • Update with your TTN credentials:
        TTN_MQTT_USERNAME=your-app@ttn
        TTN_MQTT_PASSWORD=your-api-key
        TTN_MQTT_TOPIC=v3/your-app@ttn/devices/+/up
        TTN_DEVICE_ID=your-device-id
      • Save and close
   
   Step 5: Launch Application
      • Double-click the desktop shortcut "Water Quality Monitor"
      • OR run: launch-silent.vbs from the folder

================================================================================
  METHOD 2: NETWORK SHARE / EMAIL (For Multiple Computers)
================================================================================

STEP A: CREATE ZIP PACKAGE (on current computer)
   
   Run in PowerShell:
   ```
   Compress-Archive -Path "WaterQualityMonitor-Portable" -DestinationPath "WaterQualityMonitor-Portable.zip" -Force
   ```
   
   This creates: WaterQualityMonitor-Portable.zip (~12-15 MB)

STEP B: DISTRIBUTE THE ZIP

   Option 1: Email
      • Attach WaterQualityMonitor-Portable.zip to email
      • Send to installation target computer
   
   Option 2: Network Share
      • Copy ZIP to shared network folder
      • Access from target computer
   
   Option 3: Cloud Storage
      • Upload to Google Drive / OneDrive / Dropbox
      • Download on target computer

STEP C: INSTALL ON TARGET COMPUTER

   1. Extract ZIP file to desired location
   2. Follow METHOD 1, Step 2-5 above

================================================================================
  WHAT'S INCLUDED IN THE PACKAGE
================================================================================

✓ dist/                    - Built React application
✓ electron/                - Electron desktop wrapper
✓ bridge-server/           - MQTT-HTTP bridge server  
✓ public/                  - Icons and manifest
   ├── icon.png            - Application window icon
   └── icon.ico            - Desktop shortcut icon
✓ launch-silent.vbs        - Silent launcher (no terminal)
✓ start-desktop.bat        - Desktop startup script
✓ auto-setup.bat           - Automated installation script
✓ recreate-desktop-shortcut.ps1 - Icon setup script
✓ package.json             - Dependencies configuration
✓ Documentation files      - README, INSTALLATION, TROUBLESHOOTING

NOT INCLUDED (for security):
✗ node_modules/            - Will be installed automatically
✗ .env file                - Must be created on each computer
✗ database.db              - Created automatically at runtime

================================================================================
  SYSTEM REQUIREMENTS
================================================================================

• Operating System: Windows 10/11
• Node.js: v18.0.0 or higher
• RAM: 2GB minimum, 4GB recommended
• Disk Space: 500MB for application + dependencies
• Internet: Required for initial setup and TTN connectivity

================================================================================
  QUICK VERIFICATION CHECKLIST
================================================================================

After installation, verify:

□ Desktop shortcut created with custom icon
□ Application launches without terminal window
□ Bridge server connects to TTN (check header status)
□ Sensor data appears on dashboard
□ Historical data chart shows readings
□ Footer shows: "Developed by Fluid Fusion Team · Dr. Vinod Kumar"
□ Version displayed: v1.0.0

================================================================================
  SUPPORT & TROUBLESHOOTING
================================================================================

Common Issues:

Q: Desktop icon doesn't show after installation?
A: Run recreate-desktop-shortcut.ps1 in the application folder

Q: "Node.js not found" error?
A: Install Node.js from https://nodejs.org/ and restart computer

Q: Bridge shows "Disconnected"?
A: Check .env file has correct TTN credentials

Q: Sensor shows "Offline"?
A: Verify device is transmitting to TTN network

For more help: See TROUBLESHOOTING.md in the package folder

================================================================================
  DEVELOPED BY
================================================================================

Team: Fluid Fusion
Supervisor: Dr. Vinod Kumar
Version: 1.0.0

================================================================================
