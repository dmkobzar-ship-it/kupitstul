#!/bin/bash
# KupitStul deploy script - run on server: bash deploy.sh
set -e

echo "=== [1/6] Resetting local changes and pulling latest code ==="
git stash 2>/dev/null || true
git checkout -- Dockerfile docker-compose.yml nginx/ prisma/schema.prisma package.json package-lock.json 2>/dev/null || true
git pull origin main

echo "=== [2/6] Stopping containers ==="
docker-compose down --remove-orphans 2>/dev/null || true

echo "=== [3/6] Building and starting (no cache) ==="
docker-compose up -d --build --no-cache

echo "=== [4/6] Waiting for app to be ready (40s) ==="
sleep 40

echo "=== [5/6] Running prisma db push ==="
CONTAINER=$(docker ps --format '{{.Names}}' | grep 'app' | head -1)
echo "Container: $CONTAINER"
docker exec "$CONTAINER" ./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss

echo "=== [6/6] Checking status ==="
docker ps
echo ""
echo "--- Last 30 lines of app logs ---"
docker-compose logs app --tail=30

echo ""
echo "=== DONE ==="
echo "Test: curl -s -o /dev/null -w '%{http_code}' https://kupitstul.ru/"
curl -s -o /dev/null -w "Site status: %{http_code}\n" https://kupitstul.ru/ || true
