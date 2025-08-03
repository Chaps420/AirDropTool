# XRPL Airdrop Tool - One-Click Launcher
# This script handles everything needed to run the XRPL Airdrop Tool

import os
import sys
import time
import subprocess
import webbrowser
import requests
from pathlib import Path

def print_banner():
    print("\n" + "="*60)
    print("              XRPL Airdrop Tool Launcher")
    print("="*60)
    print()

def print_status(message, status="INFO"):
    colors = {
        "SUCCESS": "\033[92m",  # Green
        "ERROR": "\033[91m",    # Red
        "WARNING": "\033[93m",  # Yellow
        "INFO": "\033[94m",     # Blue
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}{message}{reset}")

def check_python():
    """Check if Python is properly installed"""
    try:
        version = sys.version.split()[0]
        print_status(f"Python {version} detected", "SUCCESS")
        return True
    except:
        print_status("Python check failed", "ERROR")
        return False

def install_dependencies():
    """Install required Python packages"""
    print_status("Checking dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print_status("Dependencies ready", "SUCCESS")
        return True
    except subprocess.CalledProcessError:
        print_status("Warning: Could not install some dependencies", "WARNING")
        return False

def start_backend():
    """Start the Flask backend server"""
    print_status("Starting backend server...")
    try:
        # Change to backend directory and start server
        backend_dir = Path(__file__).parent / "backend"
        process = subprocess.Popen([sys.executable, "app.py"], 
                                 cwd=backend_dir,
                                 stdout=subprocess.DEVNULL,
                                 stderr=subprocess.DEVNULL)
        print_status(f"Backend started (PID: {process.pid})", "SUCCESS")
        return process
    except Exception as e:
        print_status(f"Failed to start backend: {e}", "ERROR")
        return None

def wait_for_backend(max_attempts=15):
    """Wait for backend to be ready"""
    print_status("Waiting for backend to initialize...")
    
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get("http://127.0.0.1:5000", timeout=2)
            if response.status_code == 200:
                print_status("Backend is ready!", "SUCCESS")
                return True
        except requests.exceptions.RequestException:
            pass
        
        time.sleep(1)
        if attempt % 3 == 0:
            print_status(f"Waiting for backend... ({attempt}/{max_attempts})")
    
    print_status("Backend may not have started properly", "WARNING")
    return False

def open_browser():
    """Open the frontend in browser"""
    print_status("Opening XRPL Airdrop Tool in browser...")
    
    # Get the absolute path to the frontend
    frontend_path = Path(__file__).parent / "frontend" / "index.html"
    frontend_url = f"file:///{frontend_path.as_posix()}"
    
    try:
        # Try to open in Chrome first, then default browser
        chrome_paths = [
            "C:/Program Files/Google/Chrome/Application/chrome.exe",
            "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        ]
        
        chrome_found = False
        for chrome_path in chrome_paths:
            if Path(chrome_path).exists():
                subprocess.Popen([chrome_path, frontend_url])
                print_status("Opened in Google Chrome", "SUCCESS")
                chrome_found = True
                break
        
        if not chrome_found:
            webbrowser.open(frontend_url)
            print_status("Opened in default browser", "SUCCESS")
            
    except Exception as e:
        print_status(f"Could not open browser: {e}", "WARNING")
        print_status(f"Please manually open: {frontend_url}", "WARNING")

def main():
    """Main launcher function"""
    print_banner()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Step 1: Check Python
    if not check_python():
        input("Press Enter to exit...")
        return
    
    # Step 2: Install dependencies
    install_dependencies()
    
    # Step 3: Start backend
    backend_process = start_backend()
    if not backend_process:
        input("Press Enter to exit...")
        return
    
    # Step 4: Wait for backend
    wait_for_backend()
    
    # Step 5: Open browser
    open_browser()
    
    # Success message
    print("\n" + "="*60)
    print("  XRPL Airdrop Tool is now running!")
    print("  Backend: http://127.0.0.1:5000")
    print("  Frontend: Opened in browser")
    print("="*60)
    print()
    print_status("Tool is running successfully!")
    print()
    print("Instructions:")
    print("• The tool is now ready to use in your browser")
    print("• Keep this window open to maintain the backend server")
    print("• To stop the tool, close this window or press Ctrl+C")
    print()
    
    try:
        print("Press Ctrl+C to stop the tool...")
        # Keep the script running
        while True:
            time.sleep(1)
            # Check if backend process is still running
            if backend_process.poll() is not None:
                print_status("Backend process has stopped unexpectedly", "ERROR")
                break
    except KeyboardInterrupt:
        print_status("\nStopping backend server...")
        backend_process.terminate()
        print_status("Backend stopped", "SUCCESS")
        print("Thank you for using XRPL Airdrop Tool!")

if __name__ == "__main__":
    main()
