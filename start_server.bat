@echo off
cd /d "%~dp0"

REM Standard Node.js fallback paths
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%APPDATA%\npm;%PATH%"
)
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

REM Stop old server on port 5173 if running
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173"') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo =========================================
echo   MVP DESIGN Dev Server starting
echo =========================================
echo.
echo URL: http://localhost:5173
echo.
echo Stop: Ctrl + C in this window
echo.

start http://localhost:5173
call npm.cmd run dev
if errorlevel 1 (
    echo.
    echo Error starting server.
    pause
)