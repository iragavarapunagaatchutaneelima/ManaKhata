@echo off
setlocal

cd /d "%~dp0"

echo ===================================================
echo Starting ManaKhata Enterprise Ecosystem
echo ===================================================
echo.

set "MAVEN_CMD=%CD%\maven\apache-maven-3.9.6\bin\mvn.cmd"
if not exist "%MAVEN_CMD%" set "MAVEN_CMD=mvn.cmd"

where java >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Java 17 was not found on PATH. Install Java 17 or add it to PATH.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on PATH. Install Node.js 20 or later.
  pause
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo [WARN] Python was not found on PATH. The optional AI service will not start.
  set "START_AI=false"
) else (
  set "START_AI=true"
)

echo Starting Backend Service (Spring Boot)...
start "ManaKhata Backend" /D "%CD%\backend" cmd /k call "%MAVEN_CMD%" spring-boot:run

echo Starting Frontend Service (Next.js)...
start "ManaKhata Frontend" /D "%CD%\frontend" cmd /k "npm.cmd install && npm.cmd run dev"

if "%START_AI%"=="true" (
  echo Starting AI Service (FastAPI)...
  start "ManaKhata AI Service" /D "%CD%\ai-service" cmd /k "python -m pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"
)

echo.
echo Services are booting in separate windows.
echo Frontend:   http://localhost:3000
echo Backend:    http://localhost:8080/actuator/health
echo AI service: http://localhost:8000/health
echo.
echo If a port is already in use, close the old service window or stop the process using that port.
pause
