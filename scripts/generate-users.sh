#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PACKAGE="$REPO_ROOT/src/packages/database"

# Run with no args to be walked through it interactively, or pass flags
# for non-interactive use: --count <n> --org <id|email|tag> [--role Student|Bocal|Admin]
cd "$DB_PACKAGE" && node prisma/generateUsers.js "$@"
