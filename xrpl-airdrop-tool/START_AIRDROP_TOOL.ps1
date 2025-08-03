# XRPL Airdrop Tool PowerShell Launcher
# Enhanced version with better error handling and Chrome detection

param(
    [switch]$NoWait,
    [switch]$Verbose
)

# Set console properties
$Host.UI.RawUI.WindowTitle = "XRPL Airdrop Tool Launcher"
Clear-Host

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "              XRPL Airdrop Tool Launcher" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Function to write colored status
function Write-Status {
    param($Message, $Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

# Check Python installation
Write-Status "Checking Python installation..."
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Python found: $pythonVersion" "SUCCESS"
    } else {
        throw "Python not found"
    }
} catch {
    Write-Status "Python is not installed or not in PATH" "ERROR"
    Write-Status "Please install Python 3.7+ and add it to PATH" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Status "Installing/checking dependencies..."
try {
    pip install -r requirements.txt 2>$null | Out-Null
    Write-Status "Dependencies ready" "SUCCESS"
} catch {
    Write-Status "Warning: Could not install some dependencies" "WARNING"
}

# Start backend
Write-Status "Starting backend server..."
try {
    $backendProcess = Start-Process -FilePath "python" -ArgumentList "backend\app.py" -WindowStyle Hidden -PassThru
    Write-Status "Backend process started (PID: $($backendProcess.Id))" "SUCCESS"
} catch {
    Write-Status "Failed to start backend server" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for backend to be ready
Write-Status "Waiting for backend to initialize..."
$maxAttempts = 15
$attempt = 0
$backendReady = $false

do {
    $attempt++
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Status "Backend is ready!" "SUCCESS"
            break
        }
    } catch {
        # Backend not ready yet
    }
    
    if ($Verbose) {
        Write-Status "Waiting for backend... ($attempt/$maxAttempts)"
    }
} while ($attempt -lt $maxAttempts)

if (-not $backendReady) {
    Write-Status "Backend may not have started properly" "WARNING"
    Write-Status "Continuing anyway..." "WARNING"
}

# Find Chrome and open frontend
Write-Status "Opening XRPL Airdrop Tool in browser..."

$frontendPath = "file:///$($ScriptDir.Replace('\', '/').Replace(':', '%3A'))/frontend/index.html"
$chromeFound = $false

# Chrome installation paths
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

foreach ($chromePath in $chromePaths) {
    if (Test-Path $chromePath) {
        try {
            Start-Process -FilePath $chromePath -ArgumentList $frontendPath
            Write-Status "Opened in Google Chrome" "SUCCESS"
            $chromeFound = $true
            break
        } catch {
            # Continue to next path
        }
    }
}

if (-not $chromeFound) {
    try {
        Start-Process $frontendPath
        Write-Status "Opened in default browser" "SUCCESS"
    } catch {
        Write-Status "Could not open browser automatically" "WARNING"
        Write-Status "Please manually open: $frontendPath" "WARNING"
    }
}

# Display running status
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  XRPL Airdrop Tool is now running!" -ForegroundColor Green
Write-Host "  Backend: http://127.0.0.1:5000" -ForegroundColor Yellow
Write-Host "  Frontend: Opened in browser" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Status "Tool is running successfully!"
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "• The tool is now ready to use in your browser" -ForegroundColor White
Write-Host "• Keep this window open to maintain the backend server" -ForegroundColor White
Write-Host "• To stop the tool, close this window or press Ctrl+C" -ForegroundColor White
Write-Host ""

# Store process info for cleanup
$Global:BackendProcess = $backendProcess

# Cleanup function
function Stop-AirdropTool {
    if ($Global:BackendProcess -and -not $Global:BackendProcess.HasExited) {
        Write-Status "Stopping backend server..."
        $Global:BackendProcess.Kill()
        Write-Status "Backend stopped" "SUCCESS"
    }
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-AirdropTool
}

if (-not $NoWait) {
    try {
        Write-Host "Press Ctrl+C to stop the tool, or close this window." -ForegroundColor Gray
        # Keep the script running
        while ($true) {
            Start-Sleep -Seconds 1
            # Check if backend process is still running
            if ($Global:BackendProcess.HasExited) {
                Write-Status "Backend process has stopped unexpectedly" "ERROR"
                break
            }
        }
    } catch {
        # User pressed Ctrl+C or closed window
        Stop-AirdropTool
    }
}
