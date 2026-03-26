# PaisaVasool — Auth Service

Authentication and user management microservice for the PaisaVasool platform. Built with FastAPI, PostgreSQL, and deployed on Google Cloud Run.

---

## Overview

This service is responsible for:

- User registration and login
- JWT-based access and refresh token lifecycle
- Role-based access control (admin / finance_associate)
- Admin user management (create, list, toggle status)
- Health and readiness checks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Language | Python 3.12 |
| Database | PostgreSQL (async via `asyncpg`) |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT via `python-jose` |
| Password hashing | `passlib` with Argon2 |
| Settings | Pydantic `BaseSettings` |
| Dependency management | `uv` |
| Containerisation | Docker |
| Deployment | Google Cloud Run |

---

## Project Structure

```
paisa-vasool-backend/
├── src/
│   ├── api/
│   │   └── rest/
│   │       ├── app.py               # FastAPI app, router registration
│   │       ├── dependencies.py      # get_db, get_current_user, get_current_admin
│   │       └── routes/
│   │           ├── user_routes.py   # Auth + admin endpoints
│   │           └── health_routes.py # Health + readiness endpoints
│   ├── config/
│   │   ├── settings.py              # Pydantic BaseSettings
│   │   ├── jwthandler.py            # Token creation and verification
│   │   ├── jwtbearer.py             # FastAPI auth dependency
│   │   ├── hashing.py               # Argon2 password hashing
│   │   └── logging_config.py        # Structured JSON logging setup
│   ├── core/
│   │   ├── exceptions.py            # AppError, NotFoundError, ConflictError, DatabaseError
│   │   └── services/
│   │       └── user_service.py      # Business logic layer
│   ├── data/
│   │   ├── clients/
│   │   │   └── postgres_client.py   # Async engine and session factory
│   │   ├── models/postgres/
│   │   │   ├── user.py              # User ORM model
│   │   │   └── refresh_token.py     # RefreshToken ORM model
│   │   └── repositories/
│   │       ├── generic_repository.py  # Base CRUD operations
│   │       └── user_repository.py     # User-specific queries
│   ├── schemas/
│   │   └── user_schema.py           # Pydantic request/response models
│   └── utils/
│       └── uuid.py
├── main.py                          # Uvicorn entrypoint
├── Dockerfile
├── deploy.sh                        # Cloud Run deploy script
├── pyproject.toml
├── uv.lock
└── .env.example
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1/users`.

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Register a new user | Public |
| `POST` | `/login` | Login and receive access + refresh tokens | Public |
| `POST` | `/logout` | Invalidate refresh token cookie | User |
| `POST` | `/refresh` | Issue new access token from refresh cookie | User |
| `GET` | `/auth/me` | Return current authenticated user | User |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/seed-admin` | Seed the initial admin user | Public (run once) |
| `GET` | `/admin/users` | List all non-admin users | Admin |
| `POST` | `/admin/users` | Create a new user | Admin |
| `PATCH` | `/admin/users/{user_id}/toggle-status` | Activate / deactivate a user | Admin |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/users/health/` | Liveness check |
| `GET` | `/api/v1/users/health/ready` | Readiness check (tests DB connection) |

---

## Auth Flow

```
Login  →  access_token (Bearer, 60min)  +  refresh_token (httpOnly cookie, 7 days)
       ↓
Authenticated requests  →  Authorization: Bearer <access_token>
       ↓
Token expired  →  POST /refresh  →  new access_token (cookie refreshed automatically)
       ↓
Logout  →  refresh_token revoked in DB  +  cookie cleared
```

Access tokens are short-lived JWTs. Refresh tokens are stored in the database and can be revoked individually (logout) or in bulk.

---

## Password Rules

Passwords must be at least 6 characters and contain:
- One lowercase letter
- One uppercase letter
- One number
- One special character (`!@#$%^&*` etc.)

Phone numbers must be a valid 10-digit Indian mobile number (starting with 6–9).

---

## Local Setup

**Prerequisites:** Python 3.12, `uv`, Docker, PostgreSQL

```bash
# Clone and enter the directory
git clone <repo-url>
cd paisa-vasool-backend

# Copy environment file and fill in your values
cp .env.example .env

# Install dependencies
uv sync

# Run locally
uv run uvicorn src.api.rest.app:app --reload --port 8080
```

The API will be available at `http://localhost:8080`.  
Interactive docs at `http://localhost:8080/docs`.

---

## Environment Variables

Copy `.env.example` to `.env` and set all values before running.

| Variable | Description |
|---|---|
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_NAME` | Database name |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port (default: 6379) |
| `SMTP_SERVER` | SMTP server (e.g. smtp.gmail.com) |
| `SMTP_PORT` | SMTP port (e.g. 587) |
| `SMTP_EMAIL` | Sender email address |
| `SMTP_PASSWORD` | SMTP app password |
| `JWT_SECRET_KEY` | Secret key for access tokens |
| `JWT_REFRESH_SECRET_KEY` | Secret key for refresh tokens |
| `JWT_ALGORITHM` | Signing algorithm (default: HS256) |
| `JWT_EXPIRATION_MINUTES` | Access token lifetime in minutes |
| `JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS` | Refresh token lifetime in days |
| `ADMIN_SEED_PASSWORD` | Password for the seeded admin account |

---

## Docker

```bash
# Build
docker build -t paisavasool-auth-service .

# Run
docker run -p 8080:8080 --env-file .env paisavasool-auth-service
```

---

## Deployment (Google Cloud Run)

```bash
./deploy.sh
```

The script builds the Docker image, pushes it to Google Artifact Registry, and deploys to Cloud Run with all required environment variables. Requires `gcloud` CLI authenticated with the `gwx-internship-01` project.

---

## Roles

| Role | Description |
|---|---|
| `admin` | Full access including user management endpoints |
| `finance_associate` | Standard user, access to own data only |