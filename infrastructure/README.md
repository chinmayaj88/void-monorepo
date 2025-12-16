# Infrastructure

Infrastructure configuration files and deployment scripts.

## Structure

```
infrastructure/
├── docker/              # Docker Compose files
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml (coming soon)
│   └── README.md
├── scripts/             # Deployment and utility scripts
│   ├── setup.sh (coming soon)
│   ├── deploy.sh (coming soon)
│   └── backup.sh (coming soon)
└── nginx/               # Nginx configuration files
    ├── nginx.conf (coming soon)
    └── sites-available/ (coming soon)
```

## Docker

See [docker/README.md](./docker/README.md) for Docker Compose usage.

Quick commands (from project root):
```bash
npm run docker:up      # Start services
npm run docker:down    # Stop services
npm run docker:logs    # View logs
npm run docker:ps      # List services
```

Or use docker-compose directly:
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

## Scripts

Deployment and utility scripts will be added here:
- `setup.sh` - Initial server setup
- `deploy.sh` - Application deployment
- `backup.sh` - Database backup
- `migrate.sh` - Run migrations

## Nginx

Nginx configuration files for production deployment:
- `nginx.conf` - Main configuration
- `sites-available/` - Site-specific configs

