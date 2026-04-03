# DEV_DOC.md — Developer Workflow Guide

> This document defines the daily Git workflow and project setup for all team members on **Transcendence**.
> Read it once. Follow it every day.

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [First Time Setup](#2-first-time-setup)
3. [Daily Commands](#3-daily-commands)
4. [Adding a New Service](#4-adding-a-new-service)
5. [Database & Migrations](#5-database--migrations)
6. [Shared Packages](#6-shared-packages)
7. [Starting a New Feature](#7-starting-a-new-feature)
8. [During Work](#8-during-work)
9. [When Feature is Done](#9-when-feature-is-done)
10. [PR Checklist](#10-pr-checklist)
11. [After PR is Merged](#11-after-pr-is-merged)
12. [Branch Strategy](#12-branch-strategy)
13. [Commit Convention](#13-commit-convention)
14. [Team Responsibilities](#14-team-responsibilities)
15. [Rules — What You Cannot Do](#15-rules--what-you-cannot-do)
16. [Release Flow — develop → main](#16-release-flow--develop--main)

---

## 1. Project Structure
```
Transcendence/
├── Makefile                        ← all commands live here
├── README.md
├── DEV_DOC.md
└── src/
    ├── docker-compose.yml          ← root compose (networks, volumes, includes)
    ├── docker-compose.dev.yml      ← dev overrides (hot reload, no healthcheck)
    ├── .env                        ← auto-generated, never committed
    ├── nginx/
    │   ├── docker-compose.yml
    │   └── conf.d/
    │       └── default.conf        ← routing rules (add new services here)
    ├── frontend/
    │   ├── docker-compose.yml
    │   ├── Dockerfile
    │   └── src/                    ← Angular source
    ├── database/
    │   ├── docker-compose.yml
    │   └── init.sql                ← runs once on first start
    ├── packages/
    │   ├── database/               ← shared Prisma package
    │   │   ├── prisma/
    │   │   │   ├── schema.prisma   ← ALL models for ALL services
    │   │   │   └── migrations/     ← migration history
    │   │   ├── generated/          ← auto-generated, never commit
    │   │   └── index.js            ← exports { prisma }
    │   ├── logger/                 ← shared JSON logger
    │   │   └── index.js            ← exports { info, error, warn }
    │   └── errors/                 ← shared error classes
    │       └── index.js            ← exports error classes
    └── services/
        └── user/                   ← User microservice
            ├── docker-compose.yml
            ├── Dockerfile          ← multi-stage build
            └── src/
                ├── index.js        ← Express app + central error handler
                ├── user.routes.js  ← route definitions
                └── user.service.js ← business logic + Prisma queries
```

### Network Architecture
```
internet
    │
  nginx :80                  ← only public port
    ├── /                    → frontend  (frontend-network)
    ├── /api/user/           → user-service (backend-network)
    └── /api/user/health     → user-service health check
                │
            database         (database-network — internal only)
```

| Network | Services | Internet access |
|---|---|---|
| `frontend-network` | nginx, frontend | yes (via nginx) |
| `backend-network` | nginx, services | no (internal) |
| `database-network` | services, database | no (internal) |

---

## 2. First Time Setup

> Do this **once** when you first join the project.

### Clone the repo
```bash
git clone git@github.com:yamennaani/Transcendence.git
cd Transcendence
```

### Install Docker
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker
```

### Run the project
```bash
make
```

`make` will automatically:
1. Generate `src/.env` with all default values
2. Symlink `src/packages/database/.env` → `src/.env`
3. Build and start all containers
4. Apply all pending migrations

Open your browser at **http://localhost**

---

## 3. Daily Commands

| Command | What it does |
|---|---|
| `make` | Start in dev mode (default) |
| `make dev` | Start dev mode — hot reload, no healthcheck |
| `make prod` | Start production mode — full healthchecks |
| `make down` | Stop all containers |
| `make re` | Stop, rebuild, start |
| `make logs` | Follow all container logs |
| `make status` | Show running containers |
| `make migrate` | Apply pending migrations |
| `make studio` | Open Prisma Studio at http://localhost:5555 |
| `make clean` | Stop + remove all Docker resources |
| `make fclean` | `clean` + remove `.env` |

---

## 4. Adding a New Service

> Follow these exact steps every time you add a new microservice.
```
1. Create src/services/your-service/
   └── Copy structure from services/user/

2. Add to src/docker-compose.yml:
   include:
     - services/your-service/docker-compose.yml

3. Add nginx route in src/nginx/conf.d/default.conf:
   location /api/your-service/ {
       proxy_pass http://your-service:3000/your-service/;
   }

4. Add your models to:
   src/packages/database/prisma/schema.prisma

5. Run:
   make migrate
   make re
```

### Service template structure
```
services/your-service/
├── docker-compose.yml
├── Dockerfile          ← copy from user service
├── package.json
└── src/
    ├── index.js        ← Express app + health + error handler
    ├── your.routes.js
    └── your.service.js
```

### Every service must have
```js
// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'your-service' })
})

// central error handler
app.use((err, req, res, next) => {
  logger.error('your-service', err.message)
  res.status(err.status || 500).json({ error: err.message })
})
```

---

## 5. Database & Migrations

All models live in **one place**:
```
src/packages/database/prisma/schema.prisma
```

### Workflow for schema changes
```bash
# 1. Edit the schema
vim src/packages/database/prisma/schema.prisma

# 2. Create a migration locally
cd src/packages/database
npx prisma migrate dev --name describe-your-change

# 3. Apply to Docker database
make migrate

# 4. Regenerate the client
cd src/packages/database
npx prisma generate

# 5. Rebuild affected services
make re
```

### Browse the database visually
```bash
make studio
# Opens at http://localhost:5555
```

### The `.env` setup

- `src/.env` is the **single source of truth** for all config
- `src/packages/database/.env` is automatically symlinked to `src/.env` by `make`
- `DATABASE_URL` is built from `POSTGRES_USER`, `DB_PASSWORD`, `DB_LOCAL_PORT`, `POSTGRES_DB`
- Services get `DATABASE_URL` injected via `docker-compose.yml` environment

---

## 6. Shared Packages

All shared code lives in `src/packages/`. Never copy logic between services — put it here.

### `@transcendence/database`
```js
const { prisma } = require('@transcendence/database')
const users = await prisma.user.findMany()
```

### `@transcendence/logger`
```js
const logger = require('@transcendence/logger')
logger.info('user-service', 'User created', { userId: 1 })
logger.error('user-service', 'Something failed', { error: err.message })
logger.warn('user-service', 'Slow query detected')
```

Output format:
```json
{
  "level": "info",
  "service": "user-service",
  "message": "User created",
  "data": { "userId": 1 },
  "timestamp": "2026-03-31T16:52:51.366Z"
}
```

### `@transcendence/errors`
```js
const { NotFoundError, ValidationError, UnauthorizedError, ConflictError } = require('@transcendence/errors')

// throw in service
if (!user) throw new NotFoundError('User not found')

// caught by central handler in index.js automatically
```

| Error | Status |
|---|---|
| `NotFoundError` | 404 |
| `ValidationError` | 400 |
| `UnauthorizedError` | 401 |
| `ConflictError` | 409 |

---

## 7. Starting a New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Branch naming
```
feature/service-user-auth
feature/service-game-logic
feature/frontend-login-page
fix/nginx-routing
chore/update-docker-compose
```

---

## 8. During Work
```bash
git add .
git commit -m "feat(user-service): add password reset endpoint"
git push origin feature/your-feature-name
```

### Testing changes
```bash
# Code changes → hot reload in dev mode, no action needed

# Schema changes
cd src/packages/database
npx prisma migrate dev --name your-change
make migrate
make re

# Full reset
make fclean
docker volume prune -f
make dev
```

---

## 9. When Feature is Done
```bash
git fetch origin
git rebase origin/develop
git push origin feature/your-feature-name
# Open PR on GitHub targeting develop
```

---

## 10. PR Checklist
```
✅ PR title follows commit convention
✅ Target branch is develop (never main)
✅ CI checks passing
✅ No .env files committed
✅ No generated/ folders committed
✅ No node_modules/ committed
✅ Tested locally with make dev
✅ New service added to docker-compose and nginx if applicable
✅ Schema changes have a migration file in prisma/migrations/
✅ New service imports from @transcendence/database, logger, errors
✅ Health check endpoint added to new service
✅ Requested review from a teammate
```

---

## 11. After PR is Merged
```bash
git checkout develop
git pull origin develop
git branch -d feature/your-feature-name
```

---

## 12. Branch Strategy
```
main
 └── develop
       ├── feature/service-*
       ├── feature/frontend-*
       ├── fix/*
       └── chore/*
```

| Branch | Purpose | Merges via |
|---|---|---|
| `main` | Production only | PR with 2 approvals |
| `develop` | Integration | PR with 1 approval |
| `feature/*` | Daily work | PR → develop |
| `fix/*` | Bug fixes | PR → develop |
| `chore/*` | Config / infra | PR → develop |

---

## 13. Commit Convention
```
type(scope): short description
```

### Types

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Docker, config, infra |
| `refactor` | Cleanup, no behavior change |
| `docs` | README, comments |
| `test` | Adding tests |

### Scopes

| Scope | When |
|---|---|
| `user-service` | Changes in `services/user/` |
| `frontend` | Changes in `frontend/` |
| `database` | Schema or migration changes |
| `logger` | Changes in `packages/logger/` |
| `errors` | Changes in `packages/errors/` |
| `nginx` | Routing changes |
| `docker` | Compose file changes |

### Examples
```bash
feat(user-service): add get user by id endpoint
feat(database): add Game model
fix(nginx): fix user service routing
chore(docker): add game service to compose
refactor(user-service): use central error handler
docs: update DEV_DOC with migration workflow
```

---

## 14. Team Responsibilities

| Person | Owns | Branch prefix |
|---|---|---|
| Dev 1 | `src/frontend/` | `feature/frontend-*` |
| Dev 2 | `src/frontend/` | `feature/frontend-*` |
| Dev 3 | `src/services/` | `feature/service-*` |
| Dev 4 | `src/services/` | `feature/service-*` |
| Dev 5 (lead) | `src/packages/`, `src/nginx/`, compose files, reviews | `chore/*` |

---

## 15. Rules — What You Cannot Do
```
❌ Push directly to main or develop
❌ Force push on main or develop
❌ Merge without required approvals
❌ Merge if CI is failing
❌ Commit .env files
❌ Commit generated/ folders
❌ Commit node_modules/
❌ Copy prisma directly into a service (use packages/database)
❌ Use console.log (use @transcendence/logger)
❌ Use res.status(500).json() directly (use @transcendence/errors + next(err))
```

---

## 16. Release Flow — develop → main
```bash
# 1. Test production mode locally
git checkout develop
git pull origin develop
make prod

# 2. Open PR on GitHub
# base: main  ←  compare: develop
# Title: release: v1.0.0
# Need 2 approvals + CI green

# 3. After merge — tag the release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "release: v1.0.0"
git push origin v1.0.0

# 4. Sync develop
git checkout develop
git merge main
git push origin develop
```

### Versioning
```
v1.0.0
│ │ │
│ │ └── patch  →  bug fixes       v1.0.1
│ └──── minor  →  new features    v1.1.0
└────── major  →  breaking change v2.0.0
```

---

## Quick Reference
```
Every day:
  git checkout develop && git pull origin develop
  git checkout -b feature/your-feature

While working:
  git add . && git commit -m "feat(scope): what you did"
  git push origin feature/your-feature

Done:
  git fetch origin && git rebase origin/develop
  git push origin feature/your-feature
  → open PR targeting develop

After merge:
  git checkout develop && git pull origin develop
  git branch -d feature/your-feature

Schema change:
  edit schema.prisma
  cd src/packages/database
  npx prisma migrate dev --name your-change
  make migrate && make re
```

---

> Last updated: March 2026
> Maintained by: @yamennaani