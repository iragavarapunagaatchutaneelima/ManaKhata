@echo off
setlocal

cd /d "%~dp0"

echo ===================================================
echo  Starting ManaKhata Enterprise Ecosystem
echo ===================================================
echo.

set "MAVEN_CMD=%CD%\maven\apache-maven-3.9.6\bin\mvn.cmd"
if not exist "%MAVEN_CMD%" set "MAVEN_CMD=mvn.cmd"

set "BACKEND_DIR=%CD%\backend"
set "FRONTEND_DIR=%CD%\frontend"
set "AI_DIR=%CD%\ai-service"
set "ROOT_DIR=%CD%"

:: ── Prerequisite checks ──────────────────────────────────────────
where java >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Java 17 was not found on PATH.
  pause & exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on PATH.
  pause & exit /b 1
)

set START_AI=0
where python >nul 2>nul
if not errorlevel 1 set START_AI=1

:: ── Free stale ports ─────────────────────────────────────────────
echo Clearing any stale processes on ports 8080, 3000, 8000...
for %%P in (8080 3000 8000) do (
  for /f "tokens=5" %%i in ('netstat -aon 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
    if not "%%i"=="0" (
      echo   Stopping PID %%i on port %%P
      taskkill /PID %%i /F >nul 2>nul
    )
  )
)
echo Done.
echo.

:: ── Launch services ──────────────────────────────────────────────
echo Starting Backend Service (Spring Boot)...
start "ManaKhata Backend" /D "%BACKEND_DIR%" cmd /k "%MAVEN_CMD%" spring-boot:run

echo Starting Frontend Service (Next.js)...
start "ManaKhata Frontend" /D "%FRONTEND_DIR%" cmd /k npm.cmd run dev

if "%START_AI%"=="1" (
  echo Starting AI Service [FastAPI]...
  start "ManaKhata AI" /D "%AI_DIR%" cmd /k python -m uvicorn main:app --reload --port 8000
) else (
  echo [WARN] Python not found - AI service skipped.
)

echo.
echo   Frontend  :  http://localhost:3000
echo   Backend   :  http://localhost:8080/actuator/health
echo   H2 Console:  http://localhost:8080/h2-console
echo.
pause
