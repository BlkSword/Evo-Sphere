@echo off
echo ========================================
echo Evo-Sphere Docker 部署
echo ========================================
echo.

:: 检查 Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行
    pause
    exit /b 1
)

echo [1/2] 构建镜像...
docker-compose build --no-cache
if errorlevel 1 (
    echo [错误] 构建失败
    pause
    exit /b 1
)

echo.
echo [2/2] 启动服务...
docker-compose up -d
if errorlevel 1 (
    echo [错误] 启动失败
    pause
    exit /b 1
)

echo.
timeout /t 3 /nobreak >nul
echo ========================================
echo Evo-Sphere 已启动!
echo ========================================
echo.
echo 前端: http://localhost:3000
echo 后端: http://localhost:8080
echo.
echo 日志:   docker-compose logs -f
echo 停止:   docker-compose down
echo.
pause
