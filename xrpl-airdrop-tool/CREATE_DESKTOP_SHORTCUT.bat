@echo off
title Create Desktop Shortcut for XRPL Airdrop Tool

echo.
echo Creating desktop shortcut for XRPL Airdrop Tool...
echo.

REM Get the current directory
set "CURRENT_DIR=%~dp0"
set "BATCH_FILE=%CURRENT_DIR%START_AIRDROP_TOOL.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=XRPL Airdrop Tool.lnk"

REM Create VBS script to create shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%BATCH_FILE%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "XRPL Airdrop Tool - One-click launcher" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll,21" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

REM Execute the VBS script
cscript //nologo "%TEMP%\CreateShortcut.vbs"

REM Clean up
del "%TEMP%\CreateShortcut.vbs"

echo.
echo ✓ Desktop shortcut created successfully!
echo   You can now double-click "XRPL Airdrop Tool" on your desktop to start the tool.
echo.
pause
