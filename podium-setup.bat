@echo off
setlocal EnableDelayedExpansion
title Podium - First Time Setup
color 0A

echo.
echo  ██████╗  ██████╗ ██████╗ ██╗██╗   ██╗███╗   ███╗
echo  ██╔══██╗██╔═══██╗██╔══██╗██║██║   ██║████╗ ████║
echo  ██████╔╝██║   ██║██║  ██║██║██║   ██║██╔████╔██║
echo  ██╔═══╝ ██║   ██║██║  ██║██║██║   ██║██║╚██╔╝██║
echo  ██║     ╚██████╔╝██████╔╝██║╚██████╔╝██║ ╚═╝ ██║
echo  ╚═╝      ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ ╚═╝     ╚═╝
echo.
echo  Open Source Hackathon Engine - First Time Setup
echo  ================================================
echo.

:: ─── Resolve Docker path (not always in PATH on Windows) ────────────────────
set "DOCKER_EXE="
where docker >nul 2>&1 && set "DOCKER_EXE=docker"
if "%DOCKER_EXE%"=="" (
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" (
        set "DOCKER_EXE=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe"
        set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%PATH%"
    )
)

:: ─── Check Node.js ─────────────────────────────────────────────────────────
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found.

:: ─── Check Docker ────────────────────────────────────────────────────────────
echo.
echo [2/6] Checking Docker...
if "%DOCKER_EXE%"=="" (
    echo  [ERROR] Docker is not installed or not found.
    echo  Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo  After installing, start Docker Desktop and re-run this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('"%DOCKER_EXE%" --version') do set DOCKER_VER=%%v
echo  [OK] %DOCKER_VER%

:: Check Docker daemon is actually running
"%DOCKER_EXE%" info >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Docker daemon is not running.
    echo  Please open Docker Desktop, wait for it to start, then re-run this script.
    pause
    exit /b 1
)
echo  [OK] Docker daemon is running.

:: ─── Check / Create .env ────────────────────────────────────────────────────
echo.
echo [3/6] Checking environment file...
if not exist .env (
    echo  [INFO] .env not found - copying from .env.example...
    copy .env.example .env >nul
    echo  [OK] .env created. Edit it if you need GitHub OAuth or Resend email.
) else (
    echo  [OK] .env already exists.
)

:: ─── npm install ────────────────────────────────────────────────────────────
echo.
echo [4/6] Installing npm dependencies...
if exist node_modules (
    echo  [OK] node_modules already present - skipping install.
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
)

:: ─── Start Postgres ─────────────────────────────────────────────────────────
echo.
echo [5/6] Starting PostgreSQL database (Docker)...
"%DOCKER_EXE%" compose up -d db
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to start the database container.
    echo  Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo  [OK] Waiting 5 seconds for Postgres to be ready...
timeout /t 5 /nobreak >nul

:: ─── Prisma migrate + seed ──────────────────────────────────────────────────
echo.
echo [6/6] Running database migrations and seeding demo data...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo  [WARN] migrate deploy failed - trying migrate dev instead...
    call npx prisma migrate dev --name init
)
echo.
call npm run seed
if %errorlevel% neq 0 (
    echo  [WARN] Seed had issues - it may have been seeded already. Continuing...
)

:: ─── Done ───────────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   Setup complete!
echo  ============================================================
echo.
echo   Run  podium-start.bat  to launch the dev server
echo   Run  podium-stop.bat   to stop everything
echo.
echo   Login credentials (printed above from seed output):
echo   Organizer:   organizer@podium.test
echo   Judge:       judge1@podium.test
echo   Participant: registrant1@podium.test
echo.
pause
