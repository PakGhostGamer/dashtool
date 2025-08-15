@echo off
echo Starting Amazon Dashboard Backend Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the server
echo Starting server on port 3001...
echo Press Ctrl+C to stop the server
echo.
npm run dev

REM If we get here, the server stopped
echo.
echo Server stopped. Press any key to exit...
pause >nul
