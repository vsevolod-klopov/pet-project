#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-pet}"
DB_NAME="${POSTGRES_DB:-pet_db}"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

if [ -f "src/migrations/001_initial_schema.sql" ] && [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations..."
  for migration in src/migrations/*.sql; do
    if [ -f "$migration" ]; then
      echo "  -> $(basename "$migration")"
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
    fi
  done
fi

exec "$@"
