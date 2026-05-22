@echo off
echo ===================================================
echo Starting ManaKhata Enterprise Ecosystem
echo ===================================================

echo Starting Backend Service (Spring Boot)...
start "ManaKhata Backend" cmd /k "cd backend && set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot && ..\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

echo Starting Frontend Service (Next.js)...
start "ManaKhata Frontend" cmd /k "cd frontend && npm run dev"

echo Starting AI Service (FastAPI)...
start "ManaKhata AI Service" cmd /k "cd ai-service && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"

echo All services are booting up in separate windows!
echo Keep those windows open to view logs. You can safely close this window.
pause
