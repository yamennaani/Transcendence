.DEFAULT_GOAL := dev
COMPOSE_FILE     = src/docker-compose.yml
COMPOSE_DEV_FILE = src/docker-compose.dev.yml
ENV_FILE         = src/.env
ENV_DBFILE         = src/packages/database/.env

GREEN  = \033[0;32m
RED    = \033[0;31m
YELLOW = \033[0;33m
BLUE   = \033[0;34m
RESET  = \033[0m

.PHONY: setup build up down clean restart run re dev prod check_env studio populateDB resetDB genPrismaClient seedAdmin generateUsers

setup: check_env
	@echo "$(GREEN)Setup complete.$(RESET)"

check_env:
	@echo "$(BLUE)Checking .env...$(RESET)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW).env not found — generating...$(RESET)"; \
		bash scripts/gen-env.sh --defaults && \
		echo "$(GREEN).env created at $(ENV_FILE)$(RESET)"; \
	else \
		echo "$(GREEN).env found.$(RESET)"; \
	fi
	@if [ ! -L src/packages/database/.env ]; then \
		echo "$(BLUE)Linking packages/database/.env to root .env...$(RESET)"; \
		ln -sf `pwd`/$(ENV_FILE) src/packages/database/.env; \
		echo "$(GREEN)Linked!$(RESET)"; \
	fi

migrate:
	@echo "$(BLUE)Applying migrations...$(RESET)"
	@cd src/packages/database && npx prisma migrate deploy
	@echo "$(GREEN)Migrations applied.$(RESET)"

genPrismaClient:
	@echo "$(BLUE)Generating Prisma client...$(RESET)"
	@cd src/packages/database && npm install && npx prisma@5.22.0 generate
	@echo "$(GREEN)Prisma client generated.$(RESET)"

build: setup genPrismaClient
	@echo "$(GREEN)Building images...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) build

prod: setup genPrismaClient
	@echo "$(GREEN)Starting production...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) seedAdmin
	@$(MAKE) print_url

dev: setup genPrismaClient
	@echo "$(YELLOW)Starting dev mode...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d
	@$(MAKE) migrate
	@$(MAKE) seedAdmin
	@$(MAKE) print_url

studio:
	@echo "$(BLUE)Opening Prisma Studio...$(RESET)"
	@cd src/packages/database && npx prisma studio

run: build prod 
re:  down run
restart: down prod

up:
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) print_url

down:
	@echo "$(RED)Stopping containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down

clean: down
	@echo "$(RED)Removing all Docker resources...$(RESET)"
	@docker system prune -af
	@docker volume prune -f

fclean: clean
	@echo "$(RED)Removing .env...$(RESET)"
	@rm -f $(ENV_FILE)
	@rm -f $(ENV_DBFILE)

print_url:
	@echo "$(GREEN)https://localhost$(RESET)"

status:
	@docker compose -f $(COMPOSE_FILE) ps

logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

populateDB:
	@echo "$(YELLOW)WARNING: This will wipe the current database and populate it with fake/sample data.$(RESET)"
	@printf "Type 'yes' to continue: "; \
	read answer; \
	if [ "$$answer" = "yes" ]; then \
		echo "$(BLUE)Running seed script...$(RESET)"; \
		bash scripts/populate-db.sh && \
		echo "$(GREEN)Database populated.$(RESET)"; \
	else \
		echo "$(RED)Cancelled.$(RESET)"; \
	fi

seedAdmin:
	@echo "$(BLUE)Ensuring admin user exists...$(RESET)"
	@bash scripts/seed-admin.sh
	@echo "$(GREEN)Admin user ready.$(RESET)"

generateUsers:
	@bash scripts/generate-users.sh $(ARGS)

resetDB:
	@echo "$(YELLOW)WARNING: This will wipe the current database (all data will be lost).$(RESET)"
	@printf "Type 'yes' to continue: "; \
	read answer; \
	if [ "$$answer" = "yes" ]; then \
		echo "$(BLUE)Resetting database...$(RESET)"; \
		(cd src/packages/database && npx prisma migrate reset --force --skip-seed) && \
		echo "$(GREEN)Database reset.$(RESET)"; \
		$(MAKE) migrate; \
	else \
		echo "$(RED)Cancelled.$(RESET)"; \
	fi