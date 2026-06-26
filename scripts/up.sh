#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

MODE="${1:-prod}"

if [[ "$MODE" == "dev" ]]; then
  docker compose -f docker-compose.dev.yml up --build
else
  docker compose up --build
fi
