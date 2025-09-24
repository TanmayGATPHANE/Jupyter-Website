@echo off
title Jupyter Web - Startup
echo ========================================
echo        Jupyter Web Interface
echo ========================================
echo.
echo Choose your startup option:
echo 1. Full Setup (Backend + Frontend) - REAL Python execution
echo 2. Frontend Only - Simulated execution
echo 3. Backend Only - Python API server
echo 4. Install Dependencies
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo ========================================
    echo Starting FULL SETUP with Real Python Execution
    echo ========================================
    echo.
    echo 1. Installing Python dependencies...
    pip install -r requirements.txt
    echo.
    echo 2. Starting Backend Python Server (Port 5000)...
    start "Jupyter Backend" cmd /k "python backend_server.py"
    echo.
    echo 3. Waiting for backend to start...
    timeout /t 3 /nobreak > nul
    echo.
    echo 4. Starting Frontend Web Server (Port 8000)...
    start "Jupyter Frontend" cmd /k "python -m http.server 8000"
    echo.
    echo 5. Opening in browser...
    timeout /t 2 /nobreak > nul
    start http://localhost:8000
    echo.
    echo ========================================
    echo ✅ SETUP COMPLETE!
    echo ========================================
    echo Frontend: http://localhost:8000
    echo Backend:  http://localhost:5000
    echo.
    echo Now you can execute REAL Python code!
    echo ========================================
    pause
) else if "%choice%"=="2" (
    echo.
    echo Starting Frontend Only (Simulated execution)...
    python -m http.server 8000
    pause
) else if "%choice%"=="3" (
    echo.
    echo Starting Backend Only...
    pip install -r requirements.txt
    python backend_server.py
    pause
) else if "%choice%"=="4" (
    echo.
    echo Installing Dependencies...
    pip install -r requirements.txt
    echo.
    echo Dependencies installed successfully!
    pause
) else (
    echo.
    echo Invalid choice. Starting Frontend Only...
    python -m http.server 8000
    pause
)
