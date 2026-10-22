@echo off
setlocal EnableDelayedExpansion
title Podium - Dev Server
color 0A

echo.
echo  PODIUM // DEV SERVER
echo  ====================
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

:: Check .env exists
if not exist .env (
    echo  [ERROR] .env not found. Run podium-setup.bat first.
    pause
    exit /b 1
)

:: Check node_modules exists
if not exist node_modules (
    echo  [ERROR] node_modules not found. Run podium-setup.bat first.
    pause
    exit /b 1
)

:: Start DB if not already running
echo [1/2] Ensuring database is running...
if not "%DOCKER_EXE%"=="" (
    "%DOCKER_EXE%" compose up -d db >nul 2>&1
    echo  [OK] Database check done.
) else (
    echo  [WARN] Docker not found - make sure DB is already running separately.
)

:: Start dev server
echo.
echo [2/2] Starting Podium dev server...
echo.
echo  ─────────────────────────────────────────────
echo   App running at:  http://localhost:3000
echo   Press Ctrl+C to stop the server
echo  ─────────────────────────────────────────────
echo.
echo   Sign in at http://localhost:3000/auth/signin
echo   Use: "Seeded user" option with any of:
echo     organizer@podium.test    -^> /admin/hackday-26
echo     judge1@podium.test       -^> /judge/hackday-26
echo     registrant1@podium.test  -^> /dashboard/hackday-26
echo.

call npm run dev
