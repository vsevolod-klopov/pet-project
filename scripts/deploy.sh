#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Создайте .env из .env.example и задайте DOMAIN, пароли и JWT-секреты."
  exit 1
fi

if ! grep -q '^DOMAIN=.\+' .env 2>/dev/null || grep -q '^DOMAIN=example.com' .env 2>/dev/null; then
  echo "В .env укажите реальный DOMAIN (не example.com)."
  exit 1
fi

echo "==> Сборка и запуск контейнеров..."
docker compose pull caddy 2>/dev/null || true
docker compose up -d --build

echo "==> Статус:"
docker compose ps

echo ""
echo "Готово. Сайт: https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
echo "Проверка: curl -sI https://$(grep '^DOMAIN=' .env | cut -d= -f2) | head -5"
