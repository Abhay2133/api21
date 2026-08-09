# api21 Standalone Express TypeScript API Engine

A high-performance standalone REST API engine built with **Node.js, Express, and TypeScript**.

---

## 🚀 Architecture Overview

*   **Language & Framework:** TypeScript (Node.js) powered by the **Express** framework.
*   **Database:** PostgreSQL for relational data persistence managed via `pg` pool with automated schema initialization.
*   **Caching & Limiter:** Redis (`ioredis`) managing distributed sliding window rate limiting.
*   **Rate Limiting:** Sliding window limiter (200 requests / 15 minutes per IP) applied to `/api/v1/` routes.
*   **Background Workers:** Standalone BullMQ process managed via PM2.
*   **Documentation:** Interactive, dark-themed API reference built directly into the server (accessible at root `/`).

---

## 📁 Directory Structure

```
├── src/
│   ├── config/
│   │   ├── env.ts           # Environment variable parsing and loading
│   │   ├── database.ts      # PostgreSQL connection pool and migrations
│   │   ├── redis.ts         # Redis client pool and health check
│   │   └── bullmq.ts        # BullMQ queue connection and worker manager
│   ├── middleware/
│   │   ├── cors.ts          # CORS middleware
│   │   ├── logger.ts        # Request logging middleware
│   │   ├── rateLimit.ts     # Redis sliding window rate limiter
│   │   ├── ssl.ts           # HTTPS force redirect middleware
│   │   ├── adminAuth.ts     # Session token authentication middleware
│   │   └── errorHandler.ts  # Global error handler
│   ├── controllers/
│   │   ├── healthController.ts
│   │   ├── userController.ts
│   │   ├── sessionController.ts
│   │   └── webhookController.ts
│   ├── routes/
│   │   ├── healthRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   ├── webhookRoutes.ts
│   │   └── index.ts
│   ├── app.ts               # Express application configuration
│   ├── server.ts            # Web server entrypoint
│   └── worker.ts            # Standalone BullMQ worker entrypoint
├── start.js                 # Automated deployment & health check manager
├── static/
│   └── index.html           # Interactive API documentation page
├── tests/                   # Automated Jest unit tests
├── package.json
├── tsconfig.json
└── ecosystem.config.cjs     # PM2 multi-process configuration
```

---

## 🛠️ Installation & Setup

1. **Install dependencies:**
    ```bash
    npm install
    ```

2. **Set up Local PostgreSQL Database:**
   Run the following commands in terminal to create the database and user:
   ```bash
   sudo -u postgres psql -c "CREATE USER api21_user WITH PASSWORD 'api21_password';"
   sudo -u postgres psql -c "CREATE DATABASE api21 OWNER api21_user;"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE api21 TO api21_user;"
   ```

3. **Configure Environment Variables:**
    Create or update `.env` in the root directory:
    ```env
    PORT=5000
    NODE_ENV=development
    DATABASE_URL=postgres://api21_user:api21_password@127.0.0.1:5432/api21?sslmode=disable
    REDIS_URL=redis://localhost:6379/0
    DEPLOY_CI_TOKEN=secret-ci-token
    REDEPLOY_SCRIPT=node start.js ${deployment_id}
    ```

4. **Run Database Migrations:**
    ```bash
    npm run migrate:latest
    ```

5. **Run Locally in Dev Mode:**
    - Web API Server:
      ```bash
      npm run dev
      ```
    - Standalone Queue Worker:
      ```bash
      npm run dev:worker
      ```

6. **Build TypeScript:**
    ```bash
    npm run build
    ```

7. **Run Tests:**
    ```bash
    npm test
    ```

8. **Start Production Services with PM2:**
    ```bash
    node start.js
    ```
