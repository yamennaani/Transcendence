
# ===============================================
# Default
# ===============================================

.DEFAULT_GOAL := dev

# ===============================================
# Variables
# ===============================================
COMPOSE_FILE     = src/docker-compose.yml
COMPOSE_DEV_FILE = src/docker-compose.dev.yml
ENV_FILE         = src/.env
SECRETS_DIR      = $(HOME)/.secrets/Transcendence
SECRETS          = db_password

# ===============================================
# Colors
# ===============================================
GREEN  = \033[0;32m
RED    = \033[0;31m
YELLOW = \033[0;33m
BLUE   = \033[0;34m
RESET  = \033[0m

.PHONY: setup build up down clean restart run re dev prod check_secrets check_env

# ===============================================
# Setup — run once before anything else
# ===============================================
setup: check_env check_secrets
	@echo "$(GREEN)Setup complete.$(RESET)"

check_env:
	@echo "$(BLUE)Checking .env...$(RESET)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW).env not found — generating default...$(RESET)"; \
		echo "POSTGRES_USER=user"    > $(ENV_FILE); \
		echo "POSTGRES_DB=db"       >> $(ENV_FILE); \
		echo "DB_HOST=database"     >> $(ENV_FILE); \
		echo "DB_PORT=5432"         >> $(ENV_FILE); \
		echo "PORT=3000"            >> $(ENV_FILE); \
		echo "$(GREEN).env created at $(ENV_FILE)$(RESET)"; \
	else \
		echo "$(GREEN).env found.$(RESET)"; \
	fi

check_secrets:
	@echo "$(BLUE)Checking secrets...$(RESET)"
	@mkdir -p $(SECRETS_DIR)
	@for secret in $(SECRETS); do \
		if [ ! -f $(SECRETS_DIR)/$$secret ]; then \
			echo "$(YELLOW)$$secret not found — please enter a value:$(RESET)"; \
			read -s -p "$$secret: " value; echo; \
			echo "$$value" > $(SECRETS_DIR)/$$secret; \
			chmod 600 $(SECRETS_DIR)/$$secret; \
			echo "$(GREEN)$$secret saved.$(RESET)"; \
		else \
			echo "$(GREEN)$$secret found.$(RESET)"; \
		fi \
	done

# ===============================================
# Build
# ===============================================
build: setup
	@echo "$(GREEN)Building images...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) build

# ===============================================
# Production
# ===============================================
prod: setup
	@echo "$(GREEN)Starting production...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) print_url

# ===============================================
# Development — skips healthcheck wait
# ===============================================
dev: setup
	@echo "$(YELLOW)Starting dev mode...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d
	@$(MAKE) print_url

# ===============================================
# Shortcuts
# ===============================================
run: build prod
re:  down run
restart: down prod

up:
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) print_url

down:
	@echo "$(RED)Stopping containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down

# ===============================================
# Clean
# ===============================================
clean: down
	@echo "$(RED)Removing all Docker resources...$(RESET)"
	@docker system prune -af
	@echo "$(RED)Removing volumes...$(RESET)"
	@docker volume prune -f

fclean: clean
	@echo "$(RED)Removing .env...$(RESET)"
	@rm -f $(ENV_FILE)
	@echo "$(RED)Removing secrets...$(RESET)"
	@rm -rf $(SECRETS_DIR)

# ===============================================
# Info
# ===============================================
print_url:
	@echo "$(GREEN)http://localhost$(RESET)"

status:
	@docker compose -f $(COMPOSE_FILE) ps

logs:
	@docker compose -f $(COMPOSE_FILE) logs -f