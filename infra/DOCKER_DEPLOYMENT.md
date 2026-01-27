# Docker Deployment Guide

Complete guide for deploying the Bus Optimizer system using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Configuration](#configuration)
- [Docker Commands Reference](#docker-commands-reference)
- [Production Deployment](#production-deployment)
- [Pi Agent Deployment](#pi-agent-deployment)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Minimum Version | Check Command |
|----------|-----------------|---------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker-compose --version` |
| Git | 2.0+ | `git --version` |

### Install Docker (if not installed)

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and log back in for group changes to take effect
```

**macOS:**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or using Homebrew:
brew install --cask docker
```

**Windows:**
- Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
- Enable WSL 2 backend if prompted

---

## Quick Start

For those who want to get started immediately:

```bash
# 1. Clone the repository (if not already done)
git clone <your-repo-url>
cd bus-optimizer

# 2. Navigate to infra directory
cd infra

# 3. Start all services
docker-compose up -d

# 4. Wait for services to be ready (about 30 seconds)
docker-compose ps

# 5. Access the application
# Web Dashboard: http://localhost:5175
# API Documentation: http://localhost:8000/docs
```

---

## Step-by-Step Deployment

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd bus-optimizer
```

### Step 2: Navigate to Infrastructure Directory

```bash
cd infra
```

### Step 3: Configure Environment Variables (Optional)

The default configuration works out of the box. For production, you should customize:

```bash
# View the example configuration
cat .env.example

# Create your own configuration (optional)
cp .env.example .env

# Edit the configuration
nano .env  # or use your preferred editor
```

**Key variables to customize for production:**

| Variable | Default | Production Recommendation |
|----------|---------|---------------------------|
| `POSTGRES_PASSWORD` | `postgres` | Use a strong password |
| `API_KEYS` | `ENTRY_GATE:ENTRY_SECRET` | Use secure random strings |
| `DEBUG` | `false` | Keep as `false` |

### Step 4: Build Docker Images

```bash
# Build all images (first time or after code changes)
docker-compose build

# Or build without cache (if you have issues)
docker-compose build --no-cache
```

**Expected output:**
```
Building db
Building backend
Building web
Successfully built ...
```

### Step 5: Start All Services

```bash
docker-compose up -d
```

**Expected output:**
```
Creating network "infra_bus-optimizer-network" with driver "bridge"
Creating volume "infra_postgres_data" with local driver
Creating bus-optimizer-db ... done
Creating bus-optimizer-api ... done
Creating bus-optimizer-web ... done
```

### Step 6: Verify Services Are Running

```bash
# Check container status
docker-compose ps
```

**Expected output:**
```
NAME                  STATUS                   PORTS
bus-optimizer-db      Up (healthy)            0.0.0.0:5432->5432/tcp
bus-optimizer-api     Up                      0.0.0.0:8000->8000/tcp
bus-optimizer-web     Up                      0.0.0.0:5175->80/tcp
```

### Step 7: Verify Application Health

```bash
# Check backend health
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Check web dashboard
curl -I http://localhost
# Expected: HTTP/1.1 200 OK
```

### Step 8: Access the Application

Open your web browser and navigate to:

| Service | URL | Description |
|---------|-----|-------------|
| Web Dashboard | http://localhost:5175 | Main user interface |
| Backend API | http://localhost:8000 | REST API |
| API Documentation | http://localhost:8000/docs | Swagger UI |
| API Redoc | http://localhost:8000/redoc | ReDoc documentation |

### Step 9: View Logs (Optional)

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f web
docker-compose logs -f db
```

---

## Configuration

### File Structure

```
infra/
├── docker-compose.yml      # Main orchestration file
├── docker-compose.dev.yml  # Development overrides
├── .env                    # Environment variables (created by you)
├── .env.example            # Environment template
├── Dockerfile.backend      # Backend container definition
├── Dockerfile.web          # Frontend container definition
├── Dockerfile.pi-agent     # Pi agent container (optional)
├── nginx.conf              # Nginx reverse proxy config
├── DOCKER_DEPLOYMENT.md    # This file
└── DOCKER_QUICKSTART.md    # Quick reference
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| **Database** | | |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | Database name | `bus_optimizer` |
| `DB_PORT` | External database port | `5432` |
| **Backend** | | |
| `BACKEND_PORT` | Backend API port | `8000` |
| `API_KEYS` | Comma-separated API keys | `ENTRY_GATE:ENTRY_SECRET` |
| `DEBUG` | Enable debug mode | `false` |
| **Web** | | |
| `WEB_PORT` | Web dashboard port | `5175` |
| **Pi Agent** | | |
| `PI_API_BASE_URL` | Backend URL for Pi agent | `http://backend:8000/api/bus` |
| `PI_API_KEY` | API key for Pi agent | `ENTRY_SECRET` |
| `PI_UPLOAD_INTERVAL` | Upload interval (seconds) | `60` |

### Database Initialization

On first startup, PostgreSQL automatically runs `backend/init_postgres.sql` to:
- Create database schema
- Set up tables (buses, vans, employees, attendances)
- Insert seed data (if any)

---

## Docker Commands Reference

### Basic Operations

```bash
# Start all services in background
docker-compose up -d

# Start specific services
docker-compose up -d db backend web

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Build and start
docker-compose up -d --build
```

### Viewing Logs

```bash
# View all logs (follow mode)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend

# View logs with timestamps
docker-compose logs -f -t backend
```

### Container Access

```bash
# Access backend shell
docker-compose exec backend bash

# Access database shell
docker-compose exec db psql -U postgres -d bus_optimizer

# Access web container shell
docker-compose exec web sh

# Run command in container
docker-compose exec backend python -c "print('Hello')"
```

### Database Operations

```bash
# Backup database
docker-compose exec db pg_dump -U postgres bus_optimizer > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T db psql -U postgres bus_optimizer < backup_20240101.sql

# Access PostgreSQL CLI
docker-compose exec db psql -U postgres -d bus_optimizer

# List tables
docker-compose exec db psql -U postgres -d bus_optimizer -c "\dt"

# View table data
docker-compose exec db psql -U postgres -d bus_optimizer -c "SELECT * FROM buses;"
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: deletes data!)
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Remove unused Docker resources
docker system prune -a
```

### Monitoring

```bash
# View container status
docker-compose ps

# View resource usage
docker stats

# View container details
docker inspect bus-optimizer-api
```

---

## Production Deployment

### Security Checklist

Before deploying to production, ensure you:

- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Generate secure `API_KEYS` (use `openssl rand -hex 32`)
- [ ] Set `DEBUG=false`
- [ ] Configure firewall rules
- [ ] Set up HTTPS (see below)
- [ ] Configure backup strategy

### Generate Secure API Keys

```bash
# Generate a secure API key
openssl rand -hex 32
# Output: a1b2c3d4e5f6...

# Update .env
API_KEYS=ENTRY_GATE:$(openssl rand -hex 32),BUS_SP_01:$(openssl rand -hex 32)
```

### HTTPS Setup with Caddy

1. Add Caddy to docker-compose.yml:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: bus-optimizer-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
    restart: unless-stopped
    networks:
      - bus-optimizer-network

volumes:
  caddy_data:
  caddy_config:
```

2. Create `Caddyfile`:

```
yourdomain.com {
    reverse_proxy web:80
}

api.yourdomain.com {
    reverse_proxy backend:8000
}
```

3. Update web service to not expose port 80 directly:

```yaml
services:
  web:
    # Remove ports section or change to internal only
    expose:
      - "80"
```

### Systemd Service (Auto-start on Boot)

Create `/etc/systemd/system/bus-optimizer.service`:

```ini
[Unit]
Description=Bus Optimizer Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/bus-optimizer/infra
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
ExecReload=/usr/bin/docker-compose restart
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bus-optimizer
sudo systemctl start bus-optimizer

# Check status
sudo systemctl status bus-optimizer

# View logs
sudo journalctl -u bus-optimizer -f
```

### External PostgreSQL

To use an external PostgreSQL database:

1. Update `.env`:
```env
# Comment out local DB settings
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres

# Add external DATABASE_URL in docker-compose.yml override
```

2. Modify backend environment in `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://user:password@external-host:5432/bus_optimizer
```

3. Start without local database:
```bash
docker-compose up -d backend web
```

---

## Pi Agent Deployment

### Option 1: Docker Container (Recommended for Testing)

```bash
# Start all services including pi-agent
docker-compose --profile pi-agent up -d

# Or start only pi-agent
docker-compose --profile pi-agent up -d pi-agent
```

### Option 2: Native Installation (Recommended for Production)

For production Raspberry Pi deployment, native installation provides better hardware access:

```bash
# On Raspberry Pi
cd /home/pi/bus-optimizer/pi-agent

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure
cp config.sample.json config.json
nano config.json
# Set api_base_url and api_key

# Test run
python run_agent.py

# Create systemd service (see README.md)
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs backend

# Check for port conflicts
sudo lsof -i :5175
sudo lsof -i :8000
sudo lsof -i :5432
```

### Port Already in Use

```bash
# Option 1: Kill the process using the port
sudo kill $(sudo lsof -t -i:5175)

# Option 2: Change the port in .env
echo "WEB_PORT=5176" >> .env
docker-compose up -d
```

### Database Connection Failed

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait for health check
docker-compose exec db pg_isready -U postgres
```

### Backend Health Check Failed

```bash
# Check backend logs
docker-compose logs backend

# Try to access health endpoint manually
docker-compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read())"

# Restart backend
docker-compose restart backend
```

### Web Dashboard Shows Blank Page

```bash
# Check nginx configuration
docker-compose exec web cat /etc/nginx/conf.d/default.conf

# Check if static files exist
docker-compose exec web ls -la /usr/share/nginx/html

# Check nginx logs
docker-compose logs web
```

### Cannot Connect from External Machine

```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80
sudo ufw allow 8000

# Check if services are binding to 0.0.0.0
docker-compose ps
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Remove old images
docker image prune -a

# Remove old volumes (WARNING: data loss!)
docker volume prune
```

---

## Maintenance

### Regular Backups

```bash
# Create backup script
cat > /opt/bus-optimizer/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/bus-optimizer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker-compose -f /opt/bus-optimizer/infra/docker-compose.yml exec -T db pg_dump -U postgres bus_optimizer > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql"
EOF

chmod +x /opt/bus-optimizer/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/bus-optimizer/backup.sh" | crontab -
```

### Updating the Application

```bash
# Pull latest code
cd /opt/bus-optimizer
git pull origin main

# Rebuild and restart
cd infra
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:8000/health
```

### Monitoring with Docker Stats

```bash
# Real-time resource monitoring
docker stats

# One-time snapshot
docker stats --no-stream
```

### Log Rotation

Docker logs can grow large. Configure log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                 (bus-optimizer-network)                     │
│                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐│
│  │     Web       │   │    Backend    │   │   Database    ││
│  │   (Nginx)     │──▶│   (FastAPI)   │──▶│  (PostgreSQL) ││
│  │   Port 5175   │   │   Port 8000   │   │   Port 5432   ││
│  └───────────────┘   └───────────────┘   └───────────────┘│
│         ▲                    ▲                             │
│         │              ┌─────┴─────┐                       │
│         │              │ Pi Agent  │ (optional profile)   │
│         │              │ Container │                       │
│         │              └───────────┘                       │
└─────────┼──────────────────────────────────────────────────┘
          │
    User Browser
```

### Data Flow

1. **User** accesses Web Dashboard via browser (port 5175)
2. **Nginx** serves static files and proxies API requests to Backend
3. **Backend** (FastAPI) processes requests and queries Database
4. **Database** (PostgreSQL) stores all application data
5. **Pi Agent** (optional) sends scan data to Backend API

---

## License

Internal use only - Factory Bus Optimization System
