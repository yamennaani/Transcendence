# DEV_DOC.md — Developer Workflow Guide

> This document defines the daily Git workflow for all team members on **Transcendence**.  
> Read it once. Follow it every day.

---

## Table of Contents
1. [First Time Setup](#1-first-time-setup)
2. [Starting a New Feature](#2-starting-a-new-feature)
3. [During Work](#3-during-work)
4. [When Feature is Done](#4-when-feature-is-done)
5. [PR Checklist](#5-pr-checklist)
6. [After PR is Merged](#6-after-pr-is-merged)
7. [Branch Strategy](#7-branch-strategy)
8. [Commit Convention](#8-commit-convention)
9. [Team Responsibilities](#9-team-responsibilities)
10. [Rules — What You Cannot Do](#10-rules--what-you-cannot-do)
11. [Release Flow — develop → main](#11-release-flow--develop--main)

---

## 1. First Time Setup

> Do this **once** when you first join the project.

```bash
# Clone the repo
git clone git@github.com:yamennaani/Transcendence.git
cd Transcendence

# Copy the environment file
cp .env.example .env
# Open .env and fill in your values
```

### Install Docker (if not already installed)

```bash
sudo apt update
sudo apt install docker.io docker-compose -y

# Add yourself to docker group (avoid sudo every time)
sudo usermod -aG docker $USER

# Re-login to apply group change
newgrp docker
```

### Run the project

```bash
docker compose up --build
```

That's it. No need to install Node, Angular, or Postgres on your machine. Docker handles everything.

---

## 2. Starting a New Feature

> Do this **every time** you start something new.

```bash
# 1. Switch to develop and pull the latest changes
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name
```

### Branch naming examples

```
feature/backend-auth
feature/frontend-login-page
feature/database-user-table
fix/nginx-proxy-timeout
chore/update-docker-compose
```

---

## 3. During Work

> Commit often. Small commits are better than one giant commit.

```bash
# See what changed
git status

# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat(backend): add user authentication endpoint"

# Push your branch to GitHub
git push origin feature/your-feature-name
```

---

## 4. When Feature is Done

```bash
# 1. Sync with latest develop to avoid conflicts
git fetch origin
git rebase origin/develop

# 2. Push your final changes
git push origin feature/your-feature-name

# 3. Go to GitHub
#    You will see: "feature/your-feature-name had recent pushes"
#    Click → Compare & pull request
#    ⚠️  Make sure target branch is → develop (NOT main)
```

---

## 5. PR Checklist

Before submitting your Pull Request, verify:

```
✅ PR title follows commit convention  →  feat(backend): add auth
✅ PR template is filled in
✅ Target branch is develop (never main directly)
✅ CI checks are passing (green)
✅ No .env files or secrets committed
✅ You tested locally with docker compose up
✅ You requested a review from a teammate
```

---

## 6. After PR is Merged

```bash
# Switch back to develop
git checkout develop

# Pull the latest (your merged changes are here now)
git pull origin develop

# Delete your local feature branch (it's merged, no longer needed)
git branch -d feature/your-feature-name
```

---

## 7. Branch Strategy

```
main
 └── develop
       ├── feature/backend-*
       ├── feature/frontend-*
       ├── fix/*
       └── chore/*
```

| Branch | Purpose | Merges via |
|---|---|---|
| `main` | Production only — stable code | PR with 2 approvals |
| `develop` | Integration — always working | PR with 1 approval |
| `feature/*` | Your daily work | PR → develop |
| `fix/*` | Bug fixes | PR → develop |
| `chore/*` | Config / infra changes | PR → develop |

### Golden Rules
- **Never push directly to `main` or `develop`**
- **Always branch from `develop`**
- **Always merge back into `develop`**
- **Only the team lead opens PRs from `develop` → `main`**

---

## 8. Commit Convention

Use this format for every commit:

```
type(scope): short description
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Docker, config, infra |
| `refactor` | Code cleanup, no behavior change |
| `docs` | README, comments, documentation |
| `test` | Adding or fixing tests |

### Scope

| Scope | When to use |
|---|---|
| `backend` | Changes in `/backend` |
| `frontend` | Changes in `/frontend` |
| `database` | Changes in `/database` |
| `nginx` | Changes in `/nginx` |
| `docker` | Changes in `docker-compose.yml` |

### Examples

```bash
feat(frontend): add login page
feat(backend): add JWT authentication
fix(nginx): fix proxy timeout issue
chore(docker): add redis service to compose
refactor(backend): clean up user controller
docs: update README setup instructions
```

---

## 9. Team Responsibilities

| Person | Owns | Branch prefix |
|---|---|---|
| Dev 1 | `frontend/` | `feature/frontend-*` |
| Dev 2 | `frontend/` | `feature/frontend-*` |
| Dev 3 | `backend/` | `feature/backend-*` |
| Dev 4 | `backend/` | `feature/backend-*` |
| Dev 5 (lead) | `docker-compose`, `nginx/`, `database/`, reviews PRs | `chore/*` |

---

## 10. Rules — What You Cannot Do

These are enforced by GitHub and cannot be bypassed:

```
❌ Push directly to main
❌ Push directly to develop
❌ Force push (git push --force) on main or develop
❌ Delete main or develop branches
❌ Merge without at least 1 approval (develop)
❌ Merge without at least 2 approvals (main)
❌ Merge if CI checks are failing
❌ Commit .env files or any secrets
```

---

## 11. Release Flow — develop → main

> Only the **team lead** does this when features are stable and ready for production.

### The Flow

```
develop (all features merged & tested)
        ↓
open PR → develop into main
        ↓
2 approvals required
        ↓
CI must be green
        ↓
merge into main ✅
        ↓
tag the release
```

### Step by Step

#### 1. Make sure develop is stable

```bash
git checkout develop
git pull origin develop

# Run and test everything
docker compose up --build
```

#### 2. Open the PR on GitHub

Go to GitHub → **Pull requests → New pull request**

```
base:    main
compare: develop
```

Title:
```
release: v1.0.0
```

Description:
```markdown
## Release v1.0.0

### What's included
- feat(backend): user authentication
- feat(frontend): login page
- chore(docker): add redis service

### Tested
- [ ] Tested locally with docker compose
- [ ] All CI checks passing
- [ ] All team members reviewed
```

#### 3. Get 2 Approvals

- Assign all team members as reviewers
- Need **2 approvals** before merge button activates
- CI must be green ✅

#### 4. Merge into main

Once approved → click **Squash and merge**

```bash
git checkout main
git pull origin main
```

#### 5. Tag the Release

```bash
# Create a version tag
git tag -a v1.0.0 -m "release: first stable version"

# Push the tag to GitHub
git push origin v1.0.0
```

On GitHub → **Releases → Draft a new release** → select tag `v1.0.0` → publish.

#### 6. Sync develop with main

```bash
git checkout develop
git merge main
git push origin develop
```

### Versioning Convention

```
v1.0.0
│ │ │
│ │ └── patch  →  bug fixes only       v1.0.1
│ └──── minor  →  new features         v1.1.0
└────── major  →  breaking changes     v2.0.0
```

---

## Quick Reference

```
Every day:
  git checkout develop
  git pull origin develop
  git checkout -b feature/your-feature

While working:
  git add .
  git commit -m "feat(scope): what you did"
  git push origin feature/your-feature

Done with feature:
  git fetch origin
  git rebase origin/develop
  git push origin feature/your-feature
  → open PR on GitHub targeting develop

After merge:
  git checkout develop
  git pull origin develop
  git branch -d feature/your-feature

Release (team lead only):
  PR: develop → main
  2 approvals + CI green
  git tag -a v1.0.0 -m "release: v1.0.0"
  git push origin v1.0.0
```

---

> Last updated: March 2026  
> Maintained by: @yamennaani
