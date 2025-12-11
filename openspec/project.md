# Project Context

## Purpose
Factory bus passenger counting and optimization platform that ingests employee batch-ID scans at the entry gate, deduplicates and derives shifts in Kuala Lumpur time, and surfaces headcount/attendance reporting to reduce fleet costs.

## Tech Stack
- Backend: FastAPI + SQLAlchemy (Python 3.9+), Uvicorn, PostgreSQL (SQLite for local/dev)
- Pi Agent: Python 3.9+, SQLite for offline storage, `requests` for HTTP uploads, runs on Raspberry Pi with card reader
- Web Dashboard: React + TypeScript, Vite, Tailwind CSS, ESLint/TypeScript toolchain
- Infra: Docker Compose for backend/db/web, Nginx for static web serving in production

## Project Conventions

### Code Style
- All code/config strings must be English only (no Chinese characters)
- Python: follow PEP 8 style, prefer type hints, environment settings via pydantic-settings
- Frontend: TypeScript with ESLint (`npm run lint`), Tailwind utility styling, Vite module format
- Keep payload and schema names aligned between Pi agent, backend Pydantic schemas, and frontend types

### Architecture Patterns
- Mono-repo with three subprojects: `pi-agent` (offline scan capture), `backend` (ingestion + reporting APIs), `web-dashboard` (reports/admin UI)
- Offline-first ingestion: Pi stores scans in local SQLite and periodically uploads; backend handles shift derivation, employee→bus/van resolution, and deduplication
- API key authentication via `X-API-KEY`; keys stored in backend environment
- Reporting surfaces headcount/attendance filtered by date/shift/bus; admin endpoints manage buses, vans, employees

### Testing Strategy
- No automated test suite yet; rely on manual end-to-end flow in README (backend + dashboard + Pi agent quick test)
- Run frontend lint (`npm run lint`) and TypeScript build as part of changes; add focused unit/integration tests alongside new features when possible
- Validate OpenSpec changes with `openspec validate <change-id> --strict` before proposing/merging specs

### Git Workflow
- Use feature branches with descriptive names and align with OpenSpec change IDs; keep commits scoped and clear
- Do not start implementation work until the related OpenSpec proposal is approved; update tasks checklist before merging

## Domain Context
- Employee batch-ID scans captured at factory entry; backend derives shift windows (morning 04:00–10:00, night 16:00–21:00, else unknown)
- Attendance deduplicated per (batch_id, scanned_on, shift); unknown batches/shifts are stored for follow-up
- Bus assignments come from employee records; vans map to buses; bus IDs are short (≤4 chars) with inline route text
- Dashboard consumes `GET /api/report/headcount` and `GET /api/report/attendance`; admin endpoints upsert buses, employees, and vans

## Important Constraints
- English-only identifiers/comments/strings across code and configs
- Internal network only; protect ingestion with labeled API keys
- Offline support required for Pi agent; uploads must retry without data loss
- Time zone sensitive: all shift derivation uses `Asia/Kuala_Lumpur`
- Preserve deduplication uniqueness per batch+date+shift to avoid double counting

## External Dependencies
- PostgreSQL 13+ (preferred central DB); SQLite optional for development
- Raspberry Pi hardware with card reader for batch-ID scanning
- Node.js 18+ toolchain for the dashboard; Python 3.9+ for backend/agent
- Docker/Docker Compose + Nginx for containerized deployments
- API key management shared between Pi agent config and backend environment (`API_KEYS`)
