# 🔐 Void - Security-First Personal Cloud Drive

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)
![Express](https://img.shields.io/badge/Express-4.18-black?style=for-the-badge&logo=express)

**A zero-trust, end-to-end encrypted personal cloud storage system built with Clean Architecture**

[📚 Documentation](./docs/getting-started/00-README.md) • [🚀 Quick Start](#-quick-start) • [🏗️ Architecture](#-architecture) • [🔒 Security](#-security-features)

</div>

---

## ✨ What is Void?

**Void** is a security-first personal cloud storage system that puts you in complete control of your data. Think of it as your own private Dropbox or Google Drive, but with:

- 🔐 **End-to-End Encryption** - Files encrypted on your device before upload
- 🛡️ **Zero-Knowledge Architecture** - Server cannot decrypt your data
- 🔑 **Mandatory 2FA** - Every user must enable TOTP two-factor authentication
- 💰 **Cost-Optimized** - Designed to run on Oracle Cloud Infrastructure Always Free tier
- 🏗️ **Clean Architecture** - Maintainable, testable, and scalable codebase
- 📁 **Folder Management** - Create folders, organize files, move items between folders
- 🔒 **Google Drive-Style Permissions** - Private, public, link-shared, and user-specific sharing
- ☁️ **OCI Object Storage** - Files stored in OCI buckets, not on server disk

## 🎯 Why Void?

Most cloud storage services have significant security and privacy concerns:
- ❌ Server-side encryption (provider can decrypt your files)
- ❌ Optional 2FA (many users don't enable it)
- ❌ High monthly costs
- ❌ Privacy concerns (data on third-party servers)

**Void solves all of these:**
- ✅ Client-side encryption (server cannot decrypt)
- ✅ Mandatory 2FA for all users
- ✅ Free tier optimization
- ✅ Self-hosted (you control your data)

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ and npm
- Docker Desktop
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd void-monorepo

# 2. Install dependencies
npm install
cd backend && npm install

# 3. Set up environment
cd backend
cp .env.example .env
# Edit .env with your configuration (especially OCI settings)

# 4. Start database
docker-compose up -d

# 5. Run migrations
npm run migrate:dev

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Test the API

Import the [Postman collection](./postman.json) to test all endpoints.

## 📚 Documentation

**New to the project?** Start here: **[Getting Started Guide](./docs/getting-started/00-README.md)**

### 📖 Documentation Structure

Our comprehensive documentation is organized for easy learning:

#### 🎓 Learning Path

1. **[Project Overview](./docs/getting-started/01-Project-Overview.md)** - What is this project? Why was it built?
2. **[Architecture Overview](./docs/getting-started/02-Architecture-Overview.md)** - Clean Architecture explained
3. **[Technology Stack](./docs/getting-started/03-Technology-Stack.md)** - Every technology and why we chose it
4. **[Project Setup](./docs/getting-started/04-Project-Setup.md)** - Building from scratch step-by-step

#### 🏗️ Building Guides

5. **[Database Design](./docs/database/01-Database-Design.md)** - Schema design and migrations
6. **[Domain Layer](./docs/backend/01-Domain-Layer.md)** - Entities, value objects, and domain logic
7. **[Infrastructure Layer](./docs/backend/02-Infrastructure-Layer.md)** - Database, encryption, and services
8. **[Application Layer](./docs/backend/03-Application-Layer.md)** - Use cases and business workflows
9. **[Presentation Layer](./docs/backend/04-Presentation-Layer.md)** - Controllers, routes, and middleware
10. **[Putting It All Together](./docs/backend/05-Putting-It-All-Together.md)** - Complete flow and dependency injection

#### 🔍 Deep Dives

- **[Security Documentation](./docs/security/)** - Security features and implementations
- **[Deployment Documentation](./docs/deployment/)** - Environment variables, Docker, and production deployment
- **[Troubleshooting Guide](./docs/00-Troubleshooting.md)** - Common issues and solutions
- **[Testing Documentation](./docs/testing/)** - Testing strategies and examples

## 🏗️ Architecture

The project follows **Clean Architecture** with strict layer separation:

```
┌─────────────────────────────────────────────────────────┐
│          Presentation Layer (HTTP, Express)             │
│  Controllers • Routes • Middleware • Validators        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│            Application Layer (Business Logic)            │
│  Use Cases • DTOs • Repository Interfaces              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Domain Layer (Core Business)                │
│  Entities • Value Objects • Domain Errors               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│        Infrastructure Layer (Technical Details)         │
│  Repositories • Encryption • External Services          │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

- **Dependency Rule**: Dependencies point inward
- **Testability**: Each layer can be tested independently
- **Flexibility**: Easy to swap implementations
- **Maintainability**: Clear boundaries and responsibilities

## 🛠️ Technology Stack

### Backend Core
- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 15+
- **File Storage**: OCI Object Storage (Oracle Cloud Infrastructure)
- **Testing**: Jest, ts-jest, Supertest

### Security & Authentication
- **Password Hashing**: Argon2id (memory-hard, GPU-resistant)
- **JWT**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **2FA**: TOTP (Time-based One-Time Password) - mandatory for all users
- **Rate Limiting**: Per-IP and per-user limits

### Development Tools
- **TypeScript**: Type safety and better DX
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Docker Compose**: Local database

## 🔒 Security Features

**📚 Full Security Documentation**: [Security Overview](./docs/security/01-Security-Overview.md)

### Implemented

✅ **Argon2id Password Hashing** - Industry-standard, GPU-resistant (64MB memory cost)  
✅ **JWT Authentication** - Short-lived access tokens (15min) + refresh tokens (7d)  
✅ **Token Blacklisting** - Immediate token revocation on logout  
✅ **Mandatory TOTP 2FA** - Every user must enable (RFC 6238 compliant)  
✅ **Session Service** - Secure two-step login with 3-minute sessions  
✅ **Rate Limiting** - Per-IP limits (5/15min auth, 60/1min general, 100/1min public)  
✅ **Security Headers** - 8 headers (CSP, HSTS, X-Frame-Options, etc.)  
✅ **Input Validation** - Zod schemas with type safety  
✅ **SQL Injection Prevention** - Parameterized queries only  
✅ **Error Handling** - No information leakage in production  
✅ **JWT Validation** - Issuer/audience validation, secret length check (32+ chars)  

### Planned

- CSRF token protection
- Replay attack prevention (nonce-based)
- Device management and tracking
- Audit logging
- Account lockout after failed attempts

## 📁 Project Structure

```
void-monorepo/
├── backend/                    # Node.js/TypeScript backend
│   ├── src/
│   │   ├── domain/             # Domain layer (entities, value objects)
│   │   ├── application/        # Application layer (use cases, DTOs)
│   │   ├── infrastructure/     # Infrastructure layer (repos, services)
│   │   └── presentation/       # Presentation layer (controllers, routes)
│   ├── migrations/             # Database migrations
│   ├── tests/                  # Test files
│   └── package.json
├── docs/                        # Comprehensive documentation
│   ├── getting-started/        # Learning guides
│   ├── backend/                # Backend layer guides
│   ├── database/               # Database documentation
│   ├── security/               # Security documentation
│   └── ...
├── shared/                      # Shared TypeScript types
├── infrastructure/              # Deployment configs
├── docker-compose.yml           # Local development
└── README.md                    # This file
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Step 1: Login with email/password
- `POST /api/auth/verify-totp` - Step 2: Verify TOTP code
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens

### File Management

- `POST /api/files/upload` - Upload file (supports `parentFolderId` and `accessType`)
- `GET /api/files/download/:fileId` - Download file (supports `?shareToken=xxx` for link access)
- `GET /api/files/list?parentFolderId=xxx` - List files in folder (or root if no parentFolderId)

### Folder Management

- `POST /api/files/folder` - Create folder
- `POST /api/files/move/:fileId` - Move file/folder to different folder

### Permissions & Sharing

- `PUT /api/files/access/:fileId` - Set access type (private/public/link_shared/shared)
- `POST /api/files/share/:fileId` - Share file with specific user (read/write/delete permissions)

### Protected Routes

- `GET /api/profile` - Get user profile (requires authentication)

### Health Check

- `GET /health` - Server health check

**Full API documentation**: See [API Documentation](./docs/getting-started/01-Project-Overview.md#api-documentation) or import [Postman collection](./postman.json)

## 🚀 Development

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 📦 Database Migrations

```bash
# Create new migration
npm run migrate:create -- <migration-name>

# Run migrations (dev)
npm run migrate:dev

# Run migrations (prod)
npm run migrate:prod
```

## 🎓 Learning Resources

This project is designed as a **learning resource**. By studying it, you'll learn:

- ✅ **Clean Architecture** - How to structure maintainable codebases
- ✅ **Domain-Driven Design** - Entities, value objects, and domain services
- ✅ **Security Best Practices** - Password hashing, JWT, 2FA, rate limiting
- ✅ **TypeScript** - Advanced patterns and practices
- ✅ **Testing** - Unit, integration, and E2E testing
- ✅ **API Design** - RESTful API best practices

## 🤝 Contributing

This is a learning project. When contributing:

1. Follow Clean Architecture principles
2. Write tests for new features
3. Update relevant documentation
4. Follow TypeScript best practices
5. Keep security in mind

## 📝 License

Private - All rights reserved

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Argon2](https://github.com/ranisalt/node-argon2)
- [JWT](https://jwt.io/)
- [Zod](https://zod.dev/)

## 📞 Support

For questions or issues:
- Check the [documentation](./docs/getting-started/00-README.md)
- Review the [getting started guide](./docs/getting-started/01-Project-Overview.md)
- Contact the development team

---

<div align="center">

**Built with ❤️ using Clean Architecture**

[⬆ Back to Top](#-void---security-first-personal-cloud-drive)

</div>
