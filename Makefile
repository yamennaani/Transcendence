# ===============
# Variables
# ===============
COMPOSE_FILE=./docker-compose.yml

# ===============
# Colors
# ===============
GREEN = \033[0;32m
RED = \033[0;31m
RESET = \033[0m



.PHONY: setup build up down clean print_url restart run re

setup:
	@echo "$(GREEN) Settings up ...$(RESET)"

# ===============
# Build
# ===============

build: setup
	@echo "$(GREEN) Building Docker images...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) build

# ===============
# Up / Down
# ===============

run: build up

up:
	@echo "$(GREEN) Starting Containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) print_url

down:
	@echo "$(RED) Stoping Containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down

restart: down up

re: down run

# =========================
# Cleaning
# =========================

clean: down
	@echo "$(RED)Cleaning Docker images...$(RESET)"
	@docker system prune -af


print_url:
	@echo "$(GREEN)http://localhost $(RESET)"