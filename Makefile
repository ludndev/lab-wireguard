.PHONY: help up down logs test restart clean env-check env
.DEFAULT_GOAL := help

# Load .env file
-include .env

# Colors for output
BOLD := \033[1m
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show this help message
	@echo "$(BOLD)WireGuard + wg-portal Stack$(RESET)"
	@echo ""
	@echo "$(BOLD)Usage:$(RESET) make [target]"
	@echo ""
	@echo "$(BOLD)Targets:$(RESET)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

env: ## Create .env from .env.example
	@if [ -f .env ]; then \
		echo "$(YELLOW).env already exists. Skipping.$(RESET)"; \
	else \
		echo "$(GREEN)Creating .env from .env.example...$(RESET)"; \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env created. Please review and update credentials if needed.$(RESET)"; \
	fi

env-check: env ## Verify .env file is configured
	@if grep -q "dev-test-api-token-please-change" .env; then \
		echo "$(YELLOW)⚠ WARNING: Using dev API token. Change WG_API_TOKEN before production use.$(RESET)"; \
	fi
	@if grep -q "Sup3rSecret-Admin-Pw" .env; then \
		echo "$(YELLOW)⚠ WARNING: Using default admin password. Change WG_ADMIN_PASSWORD before production use.$(RESET)"; \
	fi

up: env-check ## Start the WireGuard stack (portal only, no test)
	@echo "$(GREEN)Starting wg-portal...$(RESET)"
	docker compose up -d

up-test: env-check ## Run the full stack with automated end-to-end test (always starts clean)
	docker compose down --remove-orphans
	@echo "$(GREEN)Starting wg-portal with test profile...$(RESET)"
	docker compose --profile test up --abort-on-container-exit --exit-code-from $(WG_TEST_CONTAINER)

down: ## Stop all containers
	@echo "$(GREEN)Stopping stack...$(RESET)"
	docker compose down

down-clean: ## Stop all containers and remove volumes
	@echo "$(YELLOW)Removing containers and volumes...$(RESET)"
	docker compose down -v

logs: ## Show logs from all containers
	docker compose logs -f

logs-portal: ## Show logs from wg-portal only
	docker compose logs -f $(WG_PORTAL_CONTAINER)

logs-test: ## Show logs from test container
	docker compose logs -f $(WG_TEST_CONTAINER)

restart: down up ## Restart the stack

clean: down-clean ## Remove everything (containers, volumes, networks)
	@echo "$(GREEN)Cleanup complete. Data directory preserved.$(RESET)"

shell-portal: ## Open shell inside wg-portal container
	docker compose exec $(WG_PORTAL_CONTAINER) sh

shell-test: ## Open shell inside test container
	docker compose exec $(WG_TEST_CONTAINER) sh

ps: ## Show running containers
	docker compose ps

health: ## Check container health status
	@docker compose ps --format "table {{.Names}}\t{{.State}}\t{{.Status}}"

config: ## Show docker-compose configuration
	docker compose config

version: ## Show wg-portal image version
	@docker compose config | grep 'wgportal/wg-portal' | head -1

status: env-check ## Show current status (config check + container status)
	@echo "$(BOLD)Configuration:$(RESET)"
	@echo "  Admin User: $$(grep WG_ADMIN_USER .env | cut -d= -f2)"
	@echo "  Web Host: $$(grep WG_WEB_HOST .env | cut -d= -f2)"
	@echo "  Web Port: $$(grep WG_WEB_PORT .env | cut -d= -f2)"
	@echo "  VPN Port: $$(grep WG_VPN_PORT .env | cut -d= -f2)"
	@echo ""
	@echo "$(BOLD)Container Status:$(RESET)"
	@docker compose ps || echo "No containers running"

ui: ## Open wg-portal web UI in default browser
	@host=$$(grep WG_WEB_HOST .env | cut -d= -f2); \
	port=$$(grep WG_WEB_PORT .env | cut -d= -f2); \
	echo "Opening http://$$host:$$port"; \
	open "http://$$host:$$port" 2>/dev/null || echo "Please open http://$$host:$$port in your browser"

.PHONY: help up down logs test restart clean env-check env shell-portal shell-test ps health config version status ui down-clean logs-portal logs-test up-test
