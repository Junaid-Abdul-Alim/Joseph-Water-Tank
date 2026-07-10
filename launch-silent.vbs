' Water Quality Monitor - Silent Launcher
' This script launches the application without showing the terminal window

Set objShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Change to the application directory
objShell.CurrentDirectory = scriptDir

' Run start-desktop.bat hidden (0 = hidden, False = don't wait)
objShell.Run "start-desktop.bat", 0, False

' Clean up
Set objShell = Nothing
