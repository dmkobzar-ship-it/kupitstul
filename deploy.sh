#!/bin/bash
# KupitStul deploy script - run on server: bash deploy.sh
# After first run, GitHub Actions will auto-deploy on every git push
set -e

# === Setup GitHub Actions SSH key (one-time) ===
PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHcR7P/fBQs+nB37ZncEzApkG0MgS6xcbQ2pXESgHUR github-actions-deploy"
if ! grep -qF "$PUBKEY" ~/.ssh/authorized_keys 2>/dev/null; then
  echo "=== Adding GitHub Actions deploy key to authorized_keys ==="
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  echo "$PUBKEY" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  echo "    Key added. Now set GitHub Secrets: DEPLOY_HOST=141.98.190.172 DEPLOY_USER=root DEPLOY_SSH_KEY=<private key>"
fi

echo "=== [1/6] Resetting local changes and pulling latest code ==="
git stash 2>/dev/null || true
git checkout -- Dockerfile docker-compose.yml nginx/ prisma/schema.prisma package.json package-lock.json 2>/dev/null || true
git pull origin main

echo "=== [2/6] Stopping containers ==="
docker-compose down --remove-orphans 2>/dev/null || true

echo "=== [3/6] Building image (no cache) ==="
docker-compose build --no-cache

echo "=== [4/6] Starting containers ==="
docker-compose up -d

echo "=== [4/5] Waiting for app to be ready (50s) ==="
sleep 50

echo "=== [5/5] Running prisma db push ==="
CONTAINER=$(docker-compose ps -q app 2>/dev/null | head -1)
if [ -z "$CONTAINER" ]; then
  CONTAINER=$(docker ps --format '{{.ID}} {{.Names}}' | grep -i 'app\|kupitstul' | awk '{print $1}' | head -1)
fi
echo "Container ID: $CONTAINER"
docker exec "$CONTAINER" sh -c "cd /app && node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss"

echo "=== [6/6] Checking status ==="
docker ps
echo ""
echo "--- Last 30 lines of app logs ---"
docker-compose logs app --tail=30

echo ""
echo "=== DONE ==="
echo "Test: curl -s -o /dev/null -w '%{http_code}' https://kupitstul.ru/"
curl -s -o /dev/null -w "Site status: %{http_code}\n" https://kupitstul.ru/ || true
echo ""
echo "=== Next steps for auto-deploy ==="
echo "Add these secrets in https://github.com/dmkobzar-ship-it/kupitstul/settings/secrets/actions :"
echo "  DEPLOY_HOST = 141.98.190.172"
echo "  DEPLOY_USER = root"  
echo "  DEPLOY_SSH_KEY = (contents of ~/.ssh/kupitstul_deploy private key)"
