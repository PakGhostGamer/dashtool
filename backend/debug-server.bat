@echo off
echo Starting debug mode...
echo Current directory: %CD%
echo Node version:
node --version
echo.
echo Checking if server.js exists:
if exist server.js (
    echo server.js found
) else (
    echo server.js NOT found
)
echo.
echo Starting server with debug output...
node server.js 2>&1
echo.
echo Server stopped or crashed
pause
