@echo off
title XRPL Airdrop Tool Launcher
cls
echo.
echo =========================================================
echo              XRPL Airdrop Tool Launcher
echo =========================================================
echo.
echo Starting XRPL Airdrop Tool...
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
pip install -r requirements.txt >nul 2>&1

echo [2/3] Starting backend server...
start /b "XRPL Backend" cmd /c "cd backend && python app.py"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

REM Check if backend is running
for /l %%i in (1,1,10) do (
    curl -s http://127.0.0.1:5000 >nul 2>&1
    if not errorlevel 1 (
        echo Backend is ready!
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
    echo Waiting for backend... %%i/10
)

echo WARNING: Backend may not have started properly
:backend_ready

echo [3/3] Opening XRPL Airdrop Tool in browser...
echo.
echo =========================================================
echo  XRPL Airdrop Tool is now running!
echo  Backend: http://127.0.0.1:5000
echo  Frontend: Opening in browser...
echo =========================================================
echo.

REM Open in default browser (or specify Chrome if available)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "Chrome" "C:\Program Files\Google\Chrome\Application\chrome.exe" "file:///%~dp0frontend\index.html"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "Chrome" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "file:///%~dp0frontend\index.html"
) else (
    start "" "file:///%~dp0frontend\index.html"
)

echo.
echo Tool is running! You can close this window anytime.
echo To stop the backend, close this window or press Ctrl+C
echo.
pause
