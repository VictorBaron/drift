.PHONY: start stop restart build logs logs-app logs-db clean ps db-shell

start: ## Start all services
	docker compose up -d

stop: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose down
	docker compose up -d

build: ## Rebuild and start (after dependency changes)
	docker compose up -d --build

logs: ## Follow logs for all services
	docker compose logs -f

logs-app: ## Follow NestJS app logs
	docker compose logs -f app

logs-db: ## Follow PostgreSQL logs
	docker compose logs -f postgres

clean: ## Stop and wipe all data (volumes)
	docker compose down -v

ps: ## Show running containers
	docker compose ps

db-shell: ## Open psql shell
	docker exec -it shoulder-tap-db psql -U shouldertap

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
