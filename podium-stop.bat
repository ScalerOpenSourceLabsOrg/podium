@echo off
setlocal EnableDelayedExpansion
title Podium - Stopping
color 0C

echo.
echo  PODIUM // STOPPING
echo  ==================
echo.

:: ─── Resolve Docker path ────────────────────────────────────────────────────
set "DOCKER_EXE="
where docker >nul 2>&1 && set "DOCKER_EXE=docker"
if "%DOCKER_EXE%"=="" (
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" (
        set "DOCKER_EXE=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe"
        set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%PATH%"
    )
)

:: Kill any running Next.js dev server (node process on port 3000)
echo [1/2] Stopping Next.js dev server (if running)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo  Killing process on port 3000 (PID: %%p)...
    taskkill /PID %%p /F >nul 2>&1
)
echo  [OK] Dev server stopped (or was not running).

:: Stop docker DB
echo.
echo [2/2] Stopping database container...
if not "%DOCKER_EXE%"=="" (
    "%DOCKER_EXE%" compose stop db >nul 2>&1
    if %errorlevel% equ 0 (
        echo  [OK] Database container stopped.
    ) else (
        echo  [INFO] Database was already stopped.
    )
) else (
    echo  [INFO] Docker not found - skipping DB stop.
)

echo.
echo  ─────────────────────────────────────────────
echo   Podium fully stopped.
echo   Run podium-start.bat to start it again.
echo  ─────────────────────────────────────────────
echo.
pause
