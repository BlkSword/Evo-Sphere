@echo off
echo ========================================
echo Evo-Sphere Quick Start
echo ========================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker is not running. Starting without Redis/PostgreSQL.
) else (
    echo [1/3] Starting Docker services...
    docker-compose up -d
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/3] Starting backend server...
cd server
start cmd /k "go run cmd/server/main.go"
cd ..

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting frontend...
cd client
start cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo Evo-Sphere is starting!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
