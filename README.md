# Ft_transcendence

## Requirements
- Docker
- Docker Compose

## Getting Started

### 1. Clone the repo
git clone git@github.com:yamennaani/Ft_transcendence-.git
cd Ft_transcendence-

### 2. Setup environment
cp .env.example .env
# Edit .env with your values

### 3. Run the project
docker-compose up --build

### 4. Stop the project
docker-compose down

## Branch Strategy
- `main`    → production only, 2 approvals required
- `develop` → integration branch, 1 approval required
- `feature/*` → your daily work, branch from develop

## Starting a new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

## Commit convention
feat(backend): add login endpoint
fix(frontend): fix navbar bug
chore(docker): update compose file
