#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/var/www/mbj-v3"
SERVER_DIR="$REPO_DIR/server"

cd "$REPO_DIR"
git pull

cd "$SERVER_DIR"
npm ci --omit=dev

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrRestart ecosystem.config.js
else
  sudo systemctl daemon-reload
  sudo systemctl restart mbj-v3
fi

echo "Deploy completed"
