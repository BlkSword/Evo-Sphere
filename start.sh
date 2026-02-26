#!/bin/bash

echo "========================================"
echo "Evo-Sphere Quick Start"
echo "========================================"
echo

# Check if Docker is running
if docker info &>/dev/null; then
    echo "[1/3] Starting Docker services..."
    docker-compose up -d
    sleep 3
else
    echo "[WARNING] Docker is not running. Starting without Redis/PostgreSQL."
fi

echo
echo "[2/3] Starting backend server..."
cd server
gnome-terminal -- bash -c "go run cmd/server/main.go; exec bash" 2>/dev/null || \
xterm -e "go run cmd/server/main.go; bash" 2>/dev/null || \
go run cmd/server/main.go &
cd ..

echo "Waiting for server to start..."
sleep 3

echo
echo "[3/3] Starting frontend..."
cd client
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -e "npm run dev; bash" 2>/dev/null || \
npm run dev &
cd ..

echo
echo "========================================"
echo "Evo-Sphere is starting!"
echo "========================================"
echo
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop..."
wait
