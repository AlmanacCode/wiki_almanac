.PHONY: help setup start stop restart status seed backend frontend logs clean

SHELL := /bin/bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Full stack ──

setup: ## First-time setup: start containers, install MediaWiki, import seed pages, install deps
	@echo "▶ Starting Docker containers..."
	docker compose up -d
	@echo "▶ Waiting for MediaWiki container..."
	@until docker exec wiki-almanac-mediawiki php -v >/dev/null 2>&1; do sleep 2; done
	@if docker exec wiki-almanac-mediawiki test -f /var/www/html/LocalSettings.php; then \
		echo "✓ MediaWiki already installed."; \
	else \
		echo "▶ Installing MediaWiki..."; \
		docker exec wiki-almanac-mediawiki php maintenance/run.php install \
			--dbtype=mysql --dbserver=database --dbname=wiki_almanac \
			--dbuser=root --dbpass=rootpass --installdbuser=root --installdbpass=rootpass \
			--server="http://127.0.0.1:8080" --scriptpath="" --lang=en \
			--pass="WikiAlmanacRender!2026" "Wiki Almanac" admin; \
		echo "▶ Enabling ParserFunctions..."; \
		docker exec wiki-almanac-mediawiki bash -c \
			'echo "wfLoadExtension( \"ParserFunctions\" );" >> /var/www/html/LocalSettings.php'; \
		docker restart wiki-almanac-mediawiki; \
		sleep 3; \
	fi
	@$(MAKE) seed
	@$(MAKE) install-deps
	@echo ""
	@echo "✓ Setup complete!"
	@echo "  MediaWiki:  http://localhost:8080"
	@echo "  Run 'make start' to start backend + frontend"

seed: ## Import seed pages into MediaWiki
	@echo "▶ Importing seed pages..."
	@docker exec wiki-almanac-mediawiki rm -rf /tmp/wiki-seed-pages
	@docker exec wiki-almanac-mediawiki mkdir -p /tmp/wiki-seed-pages
	@docker cp seed-pages/. wiki-almanac-mediawiki:/tmp/wiki-seed-pages
	@docker exec wiki-almanac-mediawiki bash -c \
		'php maintenance/run.php importTextFiles.php --overwrite \
		-u "SeedImporter" -s "Seed import" /tmp/wiki-seed-pages/*.wiki'

install-deps: ## Install backend + frontend dependencies
	@echo "▶ Installing backend deps..."
	@cd backend && uv sync
	@echo "▶ Installing frontend deps..."
	@cd frontend && npm install --silent

start: ## Start everything (Docker + backend + frontend)
	@docker compose up -d
	@echo "▶ Waiting for MediaWiki..."
	@until curl -s -o /dev/null -w '' "http://127.0.0.1:8080/api.php?action=query&meta=siteinfo&format=json" 2>/dev/null; do sleep 1; done
	@echo "✓ MediaWiki ready"
	@echo "▶ Starting backend..."
	@cd backend && uv run uvicorn app.main:app --reload --port 8000 &
	@sleep 2
	@echo "▶ Starting frontend..."
	@cd frontend && npm run dev &
	@sleep 3
	@echo ""
	@echo "✓ All services running:"
	@echo "  MediaWiki:  http://localhost:8080"
	@echo "  Backend:    http://localhost:8000  (docs: http://localhost:8000/docs)"
	@echo "  Frontend:   http://localhost:5173"

stop: ## Stop backend + frontend (keeps Docker running)
	@echo "▶ Stopping backend & frontend..."
	@-pkill -f "uvicorn app.main:app" 2>/dev/null || true
	@-pkill -f "vite" 2>/dev/null || true
	@echo "✓ Stopped"

stop-all: ## Stop everything including Docker
	@$(MAKE) stop
	@echo "▶ Stopping Docker containers..."
	@docker compose stop
	@echo "✓ All stopped"

restart: stop start ## Restart backend + frontend

status: ## Show status of all services
	@echo "── Docker ──"
	@docker ps --format "  {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep wiki || echo "  not running"
	@echo ""
	@echo "── Backend (localhost:8000) ──"
	@curl -s "http://localhost:8000/health" 2>/dev/null && echo "" || echo "  not running"
	@echo ""
	@echo "── Frontend ──"
	@curl -s -o /dev/null -w "  http://localhost:%{port_used} (%{http_code})\n" "http://localhost:5173" 2>/dev/null || \
		curl -s -o /dev/null -w "  http://localhost:%{port_used} (%{http_code})\n" "http://localhost:5174" 2>/dev/null || \
		echo "  not running"

# ── Individual services ──

backend: ## Start only the backend
	@cd backend && uv run uvicorn app.main:app --reload --port 8000

frontend: ## Start only the frontend
	@cd frontend && npm run dev

logs: ## Tail MediaWiki Docker logs
	@docker logs -f wiki-almanac-mediawiki

clean: ## Remove Docker volumes (full reset — will need make setup again)
	@echo "⚠ This will delete all wiki data. Press Ctrl+C to cancel."
	@sleep 3
	@docker compose down -v
	@echo "✓ Cleaned"
