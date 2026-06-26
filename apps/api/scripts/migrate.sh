#!/usr/bin/env bash
# Run database migration on server (Linux/macOS).
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/dbname ./scripts/migrate.sh
#   ./scripts/migrate.sh postgresql://user:pass@host:5432/dbname

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="${ROOT_DIR}/src/migrations/001_initial_schema.sql"

DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "Error: set DATABASE_URL or pass connection string as first argument." >&2
  exit 1
fi

if [[ ! -f "${MIGRATION_FILE}" ]]; then
  echo "Error: migration file not found: ${MIGRATION_FILE}" >&2
  exit 1
fi

echo "Applying migration: ${MIGRATION_FILE}"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${MIGRATION_FILE}"
echo "Migration completed successfully."
