# Bus Optimizer - Docker Quick Start

Get the system running in under 5 minutes.

## Prerequisites

- Docker 20.10+ (`docker --version`)
- Docker Compose 2.0+ (`docker-compose --version`)

## Quick Deployment

### Step 1: Navigate to Infrastructure Directory

```bash
cd infra
```

### Step 2: Start All Services

```bash
docker-compose up -d
```

### Step 3: Wait for Services (30 seconds)

```bash
docker-compose ps
```

Expected output:
```
NAME                  STATUS                   PORTS
bus-optimizer-db      Up (healthy)            0.0.0.0:5432->5432/tcp
bus-optimizer-api     Up                      0.0.0.0:8000->8000/tcp
bus-optimizer-web     Up                      0.0.0.0:80->80/tcp
```

### Step 4: Access Services

| Service | URL |
|---------|-----|
| Web Dashboard | http://localhost |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart

# Or specific service
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### Database Operations

```bash
# Backup database
docker-compose exec db pg_dump -U postgres bus_optimizer > backup.sql

# Access database shell
docker-compose exec db psql -U postgres -d bus_optimizer
```

## Troubleshooting

### Port Already in Use

Edit `.env` and change ports:
```bash
echo "WEB_PORT=8080" >> .env
echo "BACKEND_PORT=8001" >> .env
docker-compose up -d
```

### Database Connection Error

```bash
docker-compose restart db
docker-compose logs db
```

### Check Resource Usage

```bash
docker stats
```

### Clean Up Everything

```bash
# WARNING: This deletes all data!
docker-compose down -v
```

## Configuration

To customize settings, copy the example and edit:

```bash
cp .env.example .env
nano .env
```

Key variables:
- `POSTGRES_PASSWORD` - Database password
- `API_KEYS` - API authentication keys
- `WEB_PORT` - Web dashboard port (default: 80)
- `BACKEND_PORT` - Backend API port (default: 8000)

## Full Documentation

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for:
- Step-by-step deployment guide
- Production deployment
- HTTPS setup
- Security hardening
- Backup and restore
- Troubleshooting
