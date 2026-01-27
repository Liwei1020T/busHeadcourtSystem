# Makefile for Bus Optimizer Docker Operations
.PHONY: help build up down restart logs ps clean backup restore shell-db test

# Default target
help:
	@echo "Bus Optimizer - Docker Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup           - Initial setup (create .env from template)"
	@echo "  make build           - Build all Docker images"
	@echo ""
	@echo "Operations:"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make restart-backend - Restart backend service"
	@echo "  make restart-web     - Restart web service"
	@echo "  make restart-db      - Restart database service"
	@echo ""
	@echo "Logs:"
	@echo "  make logs            - View logs from all services"
	@echo "  make logs-backend    - View backend logs"
	@echo "  make logs-web        - View web logs"
	@echo "  make logs-db         - View database logs"
	@echo ""
	@echo "Status:"
	@echo "  make ps              - Show running containers"
	@echo "  make stats           - Show resource usage"
	@echo "  make test            - Run health checks"
	@echo ""
	@echo "Database:"
	@echo "  make backup          - Backup database to backups/"
	@echo "  make restore FILE=   - Restore database from backup file"
	@echo "  make shell-db        - Access PostgreSQL shell"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend   - Access backend container shell"
	@echo "  make shell-web       - Access web container shell"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean           - Stop and remove containers"
	@echo "  make clean-all       - Stop and remove containers, volumes, and images"
	@echo "  make rebuild         - Rebuild and restart all services"
	@echo "  make update          - Pull code and rebuild"

# Setup commands
setup:
	@if [ ! -f infra/.env ]; then \
		cp infra/.env.example infra/.env; \
		echo "Created infra/.env from template"; \
		echo "Edit infra/.env to customize settings"; \
	else \
		echo "infra/.env already exists"; \
	fi

# Build commands
build:
	cd infra && docker-compose build

build-no-cache:
	cd infra && docker-compose build --no-cache

# Service management
up:
	cd infra && docker-compose up -d
	@echo ""
	@echo "Services starting..."
	@echo "Web Dashboard: http://localhost"
	@echo "Backend API:   http://localhost:8000"
	@echo "API Docs:      http://localhost:8000/docs"

down:
	cd infra && docker-compose down

restart:
	cd infra && docker-compose restart

restart-backend:
	cd infra && docker-compose restart backend

restart-web:
	cd infra && docker-compose restart web

restart-db:
	cd infra && docker-compose restart db

# Logging
logs:
	cd infra && docker-compose logs -f

logs-backend:
	cd infra && docker-compose logs -f backend

logs-web:
	cd infra && docker-compose logs -f web

logs-db:
	cd infra && docker-compose logs -f db

# Process status
ps:
	cd infra && docker-compose ps

# Database operations
backup:
	@mkdir -p backups
	@BACKUP_FILE=backups/backup_$$(date +%Y%m%d_%H%M%S).sql; \
	cd infra && docker-compose exec -T db pg_dump -U postgres bus_optimizer > ../$$BACKUP_FILE && \
	echo "Database backed up to $$BACKUP_FILE"

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore FILE=backups/backup_YYYYMMDD_HHMMSS.sql"; \
		exit 1; \
	fi
	cd infra && docker-compose exec -T db psql -U postgres bus_optimizer < ../$(FILE)
	@echo "Database restored from $(FILE)"

shell-db:
	cd infra && docker-compose exec db psql -U postgres -d bus_optimizer

# Shell access
shell-backend:
	cd infra && docker-compose exec backend bash

shell-web:
	cd infra && docker-compose exec web sh

# Cleanup
clean:
	cd infra && docker-compose down

clean-all:
	cd infra && docker-compose down -v --rmi all
	@echo "Removed all containers, volumes, and images"

# Health checks
test:
	@echo "Running health checks..."
	@echo ""
	@echo -n "Database:  "
	@cd infra && docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1 && echo "OK" || echo "FAILED"
	@echo -n "Backend:   "
	@curl -sf http://localhost:8000/health > /dev/null 2>&1 && echo "OK" || echo "FAILED"
	@echo -n "Web:       "
	@curl -sf http://localhost/ > /dev/null 2>&1 && echo "OK" || echo "FAILED"

# Pi Agent (optional)
up-pi:
	cd infra && docker-compose --profile pi-agent up -d

# Rebuild and restart
rebuild:
	cd infra && docker-compose up -d --build

# Show stats
stats:
	docker stats --no-stream

# Update application (pull code, rebuild, restart)
update:
	git pull origin main
	cd infra && docker-compose down
	cd infra && docker-compose build --no-cache
	cd infra && docker-compose up -d
	@echo "Application updated successfully"

# Development mode with hot reload
dev:
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
