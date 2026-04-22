# Transcendence
A peer-to-peer learning platform inspired by 42 School — built with Angular, Express microservices, PostgreSQL, and nginx, fully containerized with Docker.

## Stack
| Layer | Technology |
|---|---|
| Frontend | Angular 17 |
| Services | Express.js (microservices) |
| Database | PostgreSQL 16 + Prisma v5 |
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
- Generate `src/.env` with all default values
- Link `src/packages/database/.env` → `src/.env` automatically
- Build and start all containers
- Apply all pending database migrations

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
| `make migrate` | Apply pending database migrations |
| `make studio` | Open Prisma Studio at http://localhost:5555 |
| `make clean` | Remove all Docker resources |
| `make fclean` | Full reset — removes Docker resources and `.env` |

---

## Project Structure
```
Transcendence/
├── Makefile
├── README.md
├── DEV_DOC.md
└── src/
    ├── docker-compose.yml       ← root compose
    ├── docker-compose.dev.yml   ← dev overrides (hot reload)
    ├── .env                     ← auto-generated, never committed
    ├── nginx/                   ← routing rules
    ├── frontend/                ← Angular 17
    ├── database/                ← PostgreSQL + init.sql
    ├── packages/
    │   ├── database/            ← shared Prisma client (all models)
    │   ├── logger/              ← shared JSON logger
    │   ├── errors/              ← shared error classes
    │   └── utils/               ← shared query helpers (userUtils, classUtils, orgUtils...)
    └── services/
        ├── user/                ← User microservice
        ├── auth/                ← Auth microservice
        ├── org/                 ← Organization microservice
        ├── class/               ← Class + Assignment microservice
        ├── enroll/              ← Enrollment microservice
        └── group/               ← Group + Invite microservice
```

## Architecture
```
internet
    │
  nginx :80
    ├── /                  → frontend
    ├── /api/user/         → user-service     :3001
    ├── /api/auth/         → auth-service     :3002
    ├── /api/org/          → org-service      :3003
    ├── /api/class/        → class-service    :3004
    ├── /api/enroll/       → enroll-service   :3005
    └── /api/group/        → group-service    :3006
                │
             database      (internal network)
```

---

## API Endpoints

### User Service `/api/user`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user/` | List all users |
| GET | `/api/user/:id` | Get user by ID |
| POST | `/api/user/register` | Register a new user |
| GET | `/api/user/:id/profile` | Get user profile |
| PATCH | `/api/user/:id/profile` | Update user profile |
| DELETE | `/api/user/:id` | Delete user |

### Org Service `/api/org`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/org/` | List all organizations |
| GET | `/api/org/:id` | Get org by ID |
| POST | `/api/org/` | Create organization |
| POST | `/api/org/:id/members` | Add or move a member to org |
| DELETE | `/api/org/:id/members` | Remove member from org |

### Class Service `/api/class`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/class/` | List all classes |
| GET | `/api/class/:id` | Get class by ID |
| POST | `/api/class/` | Create class |
| GET | `/api/class/:id/assignments` | List assignments for a class |
| POST | `/api/class/:id/assignments` | Create assignment |

### Enrollment Service `/api/enroll`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/enroll/` | Enroll a student in a class |
| PATCH | `/api/enroll/` | Drop a student from a class |

### Group Service `/api/group`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/group/` | Create a group for an assignment |
| POST | `/api/group/:id/invite` | Invite a member to a group |
| PATCH | `/api/group/invite/:id` | Respond to a group invite |

---

## Adding a New Service
1. Create `src/services/your-service/`
2. Copy structure from `services/user/`
3. Add to `src/docker-compose.yml` includes
4. Add nginx route in `src/nginx/conf.d/default.conf`
5. Add models to `src/packages/database/prisma/schema.prisma`
6. Run `make migrate && make re`

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