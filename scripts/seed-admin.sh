#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PACKAGE="$REPO_ROOT/src/packages/database"

echo "Ensuring admin user exists..."
cd "$DB_PACKAGE" && npm run seed:admin
