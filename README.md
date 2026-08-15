# api21 Modular Nest.js REST API Engine

A high-performance modular REST API server built with **Node.js, Nest.js, and TypeScript**.

---

## 🚀 Architecture Overview

*   **Language & Framework:** TypeScript (Node.js) powered by the **Nest.js** modular framework with Dependency Injection.
*   **Database:** PostgreSQL for relational data persistence managed via Knex query builder with automated schema migrations.
*   **Caching & Limiter:** Redis (`ioredis`) managing distributed sliding window rate limiting.
*   **Rate Limiting:** Sliding window limiter (200 requests / 15 minutes per IP) applied to `/api/v1/` routes.
*   **Background Workers & Queues:** BullMQ queue manager with standalone worker process and Bull Board admin UI at `/admin/queues`.
*   **Documentation:** Interactive, dark-themed glassmorphic API reference built directly into the server (accessible at root `/`).

---

## 🐳 Docker Compose (Redis & PostgreSQL)

Spin up local PostgreSQL and Redis containers with persistent storage and health checks:

```bash
# Start PostgreSQL & Redis in background
npm run docker:up
# or: docker compose up -d

# View container logs
npm run docker:logs
# or: docker compose logs -f

# Stop containers
npm run docker:down
# or: docker compose down
```

---

## 📁 Monorepo Directory Structure

```text
├── apps/
│   ├── api/                     # Main Nest.js Backend API (@api21/api)
│   │   ├── src/                 # Controllers, Modules, Guards, Interceptors
│   │   ├── static/              # Interactive API Docs (index.html)
│   │   ├── tests/               # Automated Jest test suites
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── chat/                    # Future Chat Application Skeleton (@api21/chat)
│   │   ├── src/index.ts
│   │   └── package.json
│   └── admin/                   # Future Admin Dashboard Skeleton (@api21/admin)
│       ├── src/index.ts
│       └── package.json
│
├── packages/
│   └── types/                   # Shared DTOs, schemas & interfaces (@api21/types)
│       ├── src/                 # CreateUserDto, CreateSessionDto, EnqueueJobDto, etc.
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml           # Shared PostgreSQL & Redis containers
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── package.json                 # Root script orchestrator
├── start.js                     # Automated deployment & health check manager
└── ecosystem.config.cjs         # PM2 multi-process configuration
```

---

## 🛠️ Installation & Setup

1. **Install dependencies across the monorepo:**
    ```bash
    pnpm install
    ```

2. **Start Local Database & Redis with Docker Compose:**
    ```bash
    pnpm docker:up
    ```

3. **Configure Environment Variables:**
    Create or update `.env` in the root directory:
    ```env
    PORT=5000
    NODE_ENV=development
    DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable
    REDIS_URL=redis://localhost:6379/0
    DEPLOY_CI_TOKEN=secret-ci-token
    REDEPLOY_SCRIPT=node start.js ${deployment_id}
    ```

4. **Run Database Migrations:**
    ```bash
    pnpm migrate:latest
    ```

5. **Run Locally in Dev Mode:**
    - NestJS Web API Server:
      ```bash
      pnpm dev
      # or: pnpm dev:api
      ```
    - Standalone Queue Worker:
      ```bash
      pnpm dev:worker
      ```
    - Chat or Admin App Skeletons:
      ```bash
      pnpm dev:chat
      pnpm dev:admin
      ```

6. **Build All Packages:**
    ```bash
    pnpm build
    ```

7. **Run Tests:**
    ```bash
    pnpm test
    ```

8. **Start Production Services with PM2:**
    ```bash
    node start.js
    ```
