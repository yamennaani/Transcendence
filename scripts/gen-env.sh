#!/usr/bin/env bash
# =============================================================================
# scripts/gen-env.sh
#
# Generates src/.env
#
# Usage:
#   bash scripts/gen-env.sh
#   bash scripts/gen-env.sh --defaults
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$REPO_ROOT/src/.env"
DB_ENV_LINK="$REPO_ROOT/src/packages/database/.env"

# -----------------------------------------------------------------------------
# Colours
# -----------------------------------------------------------------------------

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

# -----------------------------------------------------------------------------
# Helper
# -----------------------------------------------------------------------------

DEFAULTS_MODE="no"

for arg in "$@"; do
    case "$arg" in
        --defaults|-d)
            DEFAULTS_MODE="yes"
            ;;
        --help|-h)
            echo "Usage: $0 [--defaults]"
            exit 0
            ;;
    esac
done

ask() {
    local prompt="$1"
    local default="$2"
    local secret="${3:-no}"

    if [[ "$DEFAULTS_MODE" == "yes" ]]; then
        echo "$default"
        return
    fi

    if [[ "$secret" == "yes" ]]; then
        read -rsp "$prompt [$default]: " value </dev/tty
        echo >&2
    else
        read -rp "$prompt [$default]: " value </dev/tty
    fi

    echo "${value:-$default}"
}

# -----------------------------------------------------------------------------
# Don't overwrite existing .env
# -----------------------------------------------------------------------------

if [[ -f "$ENV_FILE" ]]; then
    if [[ "$DEFAULTS_MODE" == "yes" ]]; then
        echo -e "${YELLOW}src/.env already exists.${RESET}"
        exit 0
    fi

    echo -e "${YELLOW}src/.env already exists.${RESET}"
    read -rp "Overwrite? [y/N]: " overwrite </dev/tty

    if [[ "${overwrite,,}" != "y" ]]; then
        exit 0
    fi
fi

echo
echo -e "${BOLD}${BLUE}=== Transcendence Environment Generator ===${RESET}"
echo

# -----------------------------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------------------------

echo -e "${BLUE}PostgreSQL${RESET}"

POSTGRES_USER=$(ask "Postgres User" "user")
POSTGRES_DB=$(ask "Postgres Database" "db")
DB_PASSWORD=$(ask "Postgres Password" "password" "yes")

DB_HOST="database"
DB_PORT="5432"
DB_LOCAL_PORT=$(ask "Local Postgres Port" "5433")

DATABASE_URL="postgresql://${POSTGRES_USER}:${DB_PASSWORD}@localhost:${DB_LOCAL_PORT}/${POSTGRES_DB}"
DATABASE_URL_DOCKER="postgresql://${POSTGRES_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}"

echo

# -----------------------------------------------------------------------------
# MinIO
# -----------------------------------------------------------------------------

echo -e "${BLUE}MinIO${RESET}"

MINIO_ENDPOINT=$(ask "Endpoint" "minio")
MINIO_PORT=$(ask "Port" "9000")
MINIO_ACCESS_KEY=$(ask "Access Key" "minioadmin")
MINIO_SECRET_KEY=$(ask "Secret Key" "minioadmin" "yes")
MINIO_BUCKET=$(ask "Bucket" "submissions")
MINIO_PUBLIC_HOST=$(ask "Public Host" "localhost")
MINIO_PUBLIC_PORT=$(ask "Public Port" "9000")

echo

# -----------------------------------------------------------------------------
# Authentication
# -----------------------------------------------------------------------------

echo -e "${BLUE}Authentication${RESET}"

DB_USER=$(ask "Auth DB User" "postgres")
DB_NAME=$(ask "Auth DB Name" "auth_db")

ACCESS_TOKEN_SECRET=$(ask \
    "Access Token Secret" \
    "change_this_to_random_string_1")

REFRESH_TOKEN_SECRET=$(ask \
    "Refresh Token Secret" \
    "change_this_to_random_string_2")

JWT_ACCESS_EXPIRY=$(ask "JWT Access Expiry" "15m")
JWT_REFRESH_EXPIRY=$(ask "JWT Refresh Expiry" "7d")

PASSWORD_MIN_LENGTH=$(ask "Minimum Password Length" "8")

NODE_ENV=$(ask "NODE_ENV" "development")
PORT=$(ask "Application Port" "3000")

echo

# -----------------------------------------------------------------------------
# Default admin account (seeded on first `make migrate`)
# -----------------------------------------------------------------------------

echo -e "${BLUE}Default Admin Account${RESET}"

ADMIN_EMAIL=$(ask "Admin Email" "admin@example.com")
ADMIN_USERNAME=$(ask "Admin Username" "admin")
ADMIN_PASSWORD=$(ask "Admin Password" "Test1234!" "yes")

echo

# -----------------------------------------------------------------------------
# OAuth
# -----------------------------------------------------------------------------

echo -e "${BLUE}OAuth${RESET}"

GOOGLE_CLIENT_ID=$(ask \
    "Google Client ID" \
    "your-google-client-id")

GOOGLE_CLIENT_SECRET=$(ask \
    "Google Client Secret" \
    "your-google-secret" \
    "yes")

GOOGLE_REDIRECT_URI=$(ask \
    "Google Redirect URI" \
    "https://localhost/api/auth/google/callback")

GITHUB_CLIENT_ID=$(ask \
    "GitHub Client ID" \
    "your-github-client-id")

GITHUB_CLIENT_SECRET=$(ask \
    "GitHub Client Secret" \
    "your-github-secret" \
    "yes")

GITHUB_REDIRECT_URI=$(ask \
    "GitHub Redirect URI" \
    "https://localhost/api/auth/github/callback")

echo

# -----------------------------------------------------------------------------
# Frontend
# -----------------------------------------------------------------------------

echo -e "${BLUE}Frontend${RESET}"

FRONTEND_URL=$(ask "Frontend URL" "https://localhost/")
BASE_URL=$(ask "Base URL" "https://localhost/")

echo

# -----------------------------------------------------------------------------
# Email
# -----------------------------------------------------------------------------

echo -e "${BLUE}Email${RESET}"

EMAIL_HOST=$(ask "SMTP Host" "sandbox.smtp.mailtrap.io")
EMAIL_PORT=$(ask "SMTP Port" "25")
EMAIL_USER=$(ask "SMTP Username" "abd7afb8b22993")
EMAIL_PASS=$(ask "SMTP Password" "2d08047fd50cc6" "yes")

# -----------------------------------------------------------------------------
# Write .env
# -----------------------------------------------------------------------------

mkdir -p "$(dirname "$ENV_FILE")"

cat > "$ENV_FILE" <<EOF
# =============================================================================
# src/.env — generated by scripts/gen-env.sh
# DO NOT COMMIT THIS FILE.
# =============================================================================

# PostgreSQL
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_DB=${POSTGRES_DB}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_PASSWORD=${DB_PASSWORD}
DB_LOCAL_PORT=${DB_LOCAL_PORT}

DATABASE_URL="${DATABASE_URL}"
DATABASE_URL_DOCKER="${DATABASE_URL_DOCKER}"

# MinIO
MINIO_ENDPOINT=${MINIO_ENDPOINT}
MINIO_PORT=${MINIO_PORT}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
MINIO_BUCKET=${MINIO_BUCKET}
MINIO_PUBLIC_HOST=${MINIO_PUBLIC_HOST}
MINIO_PUBLIC_PORT=${MINIO_PUBLIC_PORT}

# Authentication
DB_USER=${DB_USER}
DB_NAME=${DB_NAME}

ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}

JWT_ACCESS_EXPIRY=${JWT_ACCESS_EXPIRY}
JWT_REFRESH_EXPIRY=${JWT_REFRESH_EXPIRY}

PASSWORD_MIN_LENGTH=${PASSWORD_MIN_LENGTH}

NODE_ENV=${NODE_ENV}
PORT=${PORT}

# Default admin account (seeded on first \`make migrate\`)
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}

GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_REDIRECT_URI=${GITHUB_REDIRECT_URI}

# Frontend
FRONTEND_URL=${FRONTEND_URL}
BASE_URL=${BASE_URL}

# Email
EMAIL_HOST=${EMAIL_HOST}
EMAIL_PORT=${EMAIL_PORT}
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EOF

echo
echo -e "${GREEN}✔ Generated $ENV_FILE${RESET}"

rm -f "$DB_ENV_LINK"
ln -sf "$(realpath "$ENV_FILE")" "$DB_ENV_LINK"

echo -e "${GREEN}✔ Linked $DB_ENV_LINK -> $ENV_FILE${RESET}"

# -----------------------------------------------------------------------------
# Generate Prisma client
# -----------------------------------------------------------------------------

echo
echo -e "${BLUE}Generating Prisma client...${RESET}"

(cd "$REPO_ROOT/src/packages/database" && npx prisma@5.22.0 generate)

echo -e "${GREEN}✔ Prisma client generated.${RESET}"