.DEFAULT_GOAL := dev
COMPOSE_FILE     = src/docker-compose.yml
COMPOSE_DEV_FILE = src/docker-compose.dev.yml
ENV_FILE         = src/.env

GREEN  = \033[0;32m
RED    = \033[0;31m
YELLOW = \033[0;33m
BLUE   = \033[0;34m
RESET  = \033[0m

.PHONY: setup build up down clean restart run re dev prod check_env studio

setup: check_env
	@echo "$(GREEN)Setup complete.$(RESET)"

check_env:
	@echo "$(BLUE)Checking .env...$(RESET)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW).env not found — generating...$(RESET)"; \
		echo "POSTGRES_USER=user"                                    > $(ENV_FILE); \
		echo "POSTGRES_DB=db"                                       >> $(ENV_FILE); \
		echo "DB_HOST=database"                                     >> $(ENV_FILE); \
		echo "DB_PORT=5432"                                         >> $(ENV_FILE); \
		echo "PORT=3000"                                            >> $(ENV_FILE); \
		echo "DB_PASSWORD=password"                                 >> $(ENV_FILE); \
		echo "DB_LOCAL_PORT=5433"									>> $(ENV_FILE); \
		echo "$(GREEN).env created at $(ENV_FILE)$(RESET)"; \
	else \
		echo "$(GREEN).env found.$(RESET)"; \
	fi
	@if [ ! -L src/packages/database/.env ]; then \
		echo "$(BLUE)Linking packages/database/.env to root .env...$(RESET)"; \
		ln -sf $(PWD)/$(ENV_FILE) src/packages/database/.env; \
		echo "$(GREEN)Linked!$(RESET)"; \
	fi

migrate:
	@echo "$(BLUE)Applying migrations...$(RESET)"
	@cd src/packages/database && npx prisma migrate deploy
	@echo "$(GREEN)Migrations applied.$(RESET)"

build: setup
	@echo "$(GREEN)Building images...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) build

prod: setup
	@echo "$(GREEN)Starting production...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) print_url

dev: setup
	@echo "$(YELLOW)Starting dev mode...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d
	@$(MAKE) migrate
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

print_url:
	@echo "$(GREEN)http://localhost$(RESET)"

status:
	@docker compose -f $(COMPOSE_FILE) ps

logs:
	@docker compose -f $(COMPOSE_FILE) logs -f