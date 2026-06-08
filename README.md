# TaskFlow

A full-stack REST API with JWT authentication, role-based access control, and a React frontend.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Frontend | React + Vite + React Router |
| Containers | Docker + Docker Compose |

---

## 🌐 Live Demo

You can test the live hosted application here:
👉 **[Live Website Link](taskflow-git-main-krish619s-projects.vercel.app)**

### 🔑 Demo Credentials
Skip registration and log in directly using this pre-configured admin account to test all features:
* **Email:** `admin@taskflow.com`
* **Password:** `AdminPassword123!`


## Quick Start (Docker)

```bash
git clone <repo-url>
cd taskflow
docker compose up
```

- Frontend: http://localhost:3000
- API: http://localhost:5000
- Swagger docs: http://localhost:5000/api/docs

---

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and a strong JWT_SECRET
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm install
npm run dev
```

---

## API Reference

Full Swagger docs at `/api/docs` when the server is running.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | — | Register user |
| POST | /api/v1/auth/login | — | Login, get JWT |
| GET | /api/v1/auth/me | Bearer | Current user |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/tasks | Bearer | List tasks (own / all for admin) |
| GET | /api/v1/tasks/:id | Bearer | Get single task |
| POST | /api/v1/tasks | Bearer | Create task |
| PATCH | /api/v1/tasks/:id | Bearer | Update task |
| DELETE | /api/v1/tasks/:id | Bearer | Delete task |

Query params for list: `?status=todo&priority=high&page=1&limit=20`

### Users (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/users | Admin | List all users |
| GET | /api/v1/users/:id | Admin | Get user |
| PATCH | /api/v1/users/:id/role | Admin | Update role |
| PATCH | /api/v1/users/:id/deactivate | Admin | Deactivate user |

---

## Database Schema

```sql
users
  id            UUID PRIMARY KEY
  name          VARCHAR(100)
  email         VARCHAR(255) UNIQUE
  password_hash VARCHAR(255)       -- bcrypt, never exposed
  role          VARCHAR(20)        -- 'user' | 'admin'
  is_active     BOOLEAN
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

tasks
  id          UUID PRIMARY KEY
  title       VARCHAR(200)
  description TEXT
  status      VARCHAR(20)  -- 'todo' | 'in_progress' | 'done'
  priority    VARCHAR(10)  -- 'low' | 'medium' | 'high'
  owner_id    UUID → users(id) CASCADE DELETE
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ
```

---

## Security Practices

- **Passwords** hashed with bcrypt (12 rounds)
- **Timing attack prevention** on login — bcrypt compare always runs
- **JWT** signed with HS256, 24h expiry; verified on every protected request
- **Error responses** never leak DB error messages, stack traces, or user data
- **Console logging** only logs status codes and error types — never request bodies, tokens, or response data
- **Helmet** sets security headers on every response
- **Rate limiting** — 200 req/15min globally, 20 req/15min on auth routes
- **Input sanitization** via express-validator on all user inputs
- **Ownership enforcement** — users can only CRUD their own tasks; admins can access all

---

## Deploying to Production

### Railway / Render / Fly.io (recommended for solo projects)

1. Create a PostgreSQL database service
2. Set environment variables:
   ```
   DATABASE_URL=<from provider>
   JWT_SECRET=<64+ random chars, generate with: openssl rand -base64 48>
   NODE_ENV=production
   FRONTEND_URL=<your frontend domain>
   ```
3. Deploy from GitHub — Railway/Render auto-detects Node.js

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your backend URL
2. Push `frontend/` — Vercel auto-detects Vite
3. Set rewrite rules: all routes → `index.html`

---

## Scalability Notes

This project is structured to scale cleanly:

### Horizontal scaling
The API is **stateless** — JWT tokens carry all auth state, no server-side sessions. Multiple instances can run behind a load balancer (nginx, AWS ALB) without sticky sessions.

### Caching (next step)
Add Redis for:
- **Session blocklist** — revoke tokens before expiry
- **Rate limit state** — share counters across instances
- **Query caching** — cache task list responses with short TTLs

```bash
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  ports: ['6379:6379']
```

### Microservices path
The module structure (`/routes`, `/controllers`, `/validators`) maps cleanly to separate services:
- `auth-service` → handles registration, login, token verification
- `task-service` → CRUD for tasks
- `user-service` → admin user management
- API Gateway (nginx or Kong) routes between them

### Database
- Add read replicas for heavy read loads (`pg` supports multiple connection strings)
- Add indexes: `tasks(owner_id, status)` composite index for filtered list queries
- Use connection pooling (PgBouncer) in production

### Observability
- Replace `morgan` with structured JSON logging (winston / pino)
- Add request IDs for tracing across services
- Health check endpoint at `/health` is ready for load balancer probes

---

## API Documentation (Swagger)

While the backend is running, open in your browser:

```
http://localhost:5000/api/docs
```

### How to use Swagger

**Testing a public endpoint (register / login):**
1. Click an endpoint e.g. `POST /api/v1/auth/register`
2. Click **"Try it out"**
3. Edit the JSON body with your values
4. Click **"Execute"**
5. See the live response below

**Testing protected endpoints (tasks, users):**

These routes require a JWT token. Steps:

1. Run `POST /api/v1/auth/login` in Swagger → copy the `token` string from the response
2. Click the **"Authorize"** button at the top right of the Swagger page (🔓 icon)
3. Paste your token in the Value field — just the token, nothing else
4. Click **Authorize** then **Close**
5. All protected endpoints now automatically send your token

### What is Bearer / JWT?

Every protected API call proves your identity by sending a token in the request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT (JSON Web Token) is a signed string that encodes your user ID and role. The backend verifies the signature on every request — no database lookup needed. Tokens expire after 24 hours. When you click Authorize in Swagger, it adds this header automatically to every request you make.
