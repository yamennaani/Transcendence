# Transcendence

A full-stack web application built with Angular, Express, PostgreSQL, and nginx — fully containerized with Docker.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 |
| Backend | Express.js |
| Database | PostgreSQL 16 |
| Reverse proxy | nginx |
| Containerization | Docker + Docker Compose |

## Requirements

- Docker
- Docker Compose
- Make

## Getting Started

### 1. Clone the repo

```bash
git clone git@github.com:yamennaani/Transcendence.git
cd Transcendence
```

### 2. Run

```bash
make
```

That's it. On first run, `make` will:
- Generate `src/.env` with default values if it doesn't exist
- Prompt you to create secrets if they don't exist
- Build and start all containers in dev mode

Open your browser at **http://localhost**

---

## Commands

| Command | Description |
|---|---|
| `make` | Start in dev mode (default) |
| `make dev` | Start in dev mode — hot reload, instant startup |
| `make prod` | Start in production mode — full healthchecks |
| `make down` | Stop all containers |
| `make re` | Stop, rebuild, and start |
| `make logs` | Follow all container logs |
| `make status` | Show running containers |
| `make clean` | Remove all Docker resources |
| `make fclean` | Full reset — removes Docker resources, `.env`, and secrets |

---

## Project Structure

```
Transcendence/
├── Makefile
├── README.md
├── DEV_DOC.md
└── src/
    ├── docker-compose.yml       ← root compose
    ├── docker-compose.dev.yml   ← dev overrides
    ├── .env                     ← auto-generated, not committed
    ├── nginx/
    ├── frontend/                ← Angular 17
    ├── backend/                 ← Express.js
    └── database/                ← PostgreSQL + init.sql
```

## Secrets

Sensitive credentials are stored **outside the project** at `~/.secrets/Transcendence/` and are never committed to Git.

`make` will prompt you to set them on first run.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/` | Health check |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a user |

---

## Branch Strategy

```
main        → production only, 2 approvals required
develop     → integration, 1 approval required
feature/*   → your daily work, branch from develop
fix/*       → bug fixes
chore/*     → config and infra changes
```

See [DEV_DOC.md](./DEV_DOC.md) for the full Git workflow.

## Contributing

1. Branch from `develop`
2. Follow the commit convention: `feat(scope): description`
3. Open a PR targeting `develop`
4. Never push directly to `main` or `develop`

---

> Maintained by [@yamennaani](https://github.com/yamennaani)