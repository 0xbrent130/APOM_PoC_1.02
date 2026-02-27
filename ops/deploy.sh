#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-apom}"

export COMPOSE_PROJECT_NAME="$PROJECT_NAME"

if [[ ! -f .env.compose ]]; then
  echo "Missing .env.compose. Copy .env.compose.example and set production values."
  exit 1
fi

echo "[deploy] Building latest images"
docker compose -f "$COMPOSE_FILE" build backend frontend reverse-proxy

echo "[deploy] Ensuring db volume service is online"
docker compose -f "$COMPOSE_FILE" up -d db

echo "[deploy] Running migration gate"
if ! docker compose --profile deploy -f "$COMPOSE_FILE" run --rm backend-migrate; then
  echo "[deploy] Migration failed. Existing running stack left unchanged."
  exit 1
fi

echo "[deploy] Applying updated app services"
docker compose -f "$COMPOSE_FILE" up -d backend frontend reverse-proxy

echo "[deploy] Deployment finished"
docker compose -f "$COMPOSE_FILE" ps
