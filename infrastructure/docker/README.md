# Docker Compose Files

Docker Compose configurations for different environments.

## Files

- `docker-compose.dev.yml` - Development environment (PostgreSQL + Adminer)
- `docker-compose.prod.yml` - Production environment (coming soon)
- `docker-compose.test.yml` - Test environment (coming soon)

## Usage

### Development

From project root:
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

Or create an alias/script:
```bash
# From root
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
docker-compose -f infrastructure/docker/docker-compose.dev.yml down
```

### Services

- **PostgreSQL**: `localhost:5432`
- **Adminer**: `http://localhost:8080`

## Environment Variables

Docker Compose reads `.env` from the project root automatically.

## Volumes

- `postgres_data` - Persistent database storage
- Migrations are mounted from `backend/migrations/`

