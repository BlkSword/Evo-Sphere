#!/bin/bash

echo "========================================"
echo "Evo-Sphere Docker 部署"
echo "========================================"
echo

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "[错误] Docker 未运行"
    exit 1
fi

echo "[1/2] 构建镜像..."
docker-compose build --no-cache

echo
echo "[2/2] 启动服务..."
docker-compose up -d

echo
sleep 3
echo "========================================"
echo "Evo-Sphere 已启动!"
echo "========================================"
echo
echo "前端: http://localhost:3000"
echo "后端: http://localhost:8080"
echo
echo "日志:   docker-compose logs -f"
echo "停止:   docker-compose down"
echo
