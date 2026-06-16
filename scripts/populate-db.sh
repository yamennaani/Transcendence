#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PACKAGE="$REPO_ROOT/src/packages/database"

echo "Installing dependencies in packages/database..."
cd "$DB_PACKAGE" && npm install

echo "Running seed..."
npm run seed
