# api21 Standalone Express TypeScript API Engine

A high-performance standalone REST API engine built with **Node.js, Express, and TypeScript**.

---

## 🚀 Architecture Overview

*   **Language & Framework:** TypeScript (Node.js) powered by the **Express** framework.
*   **Database:** PostgreSQL for relational data persistence managed via `pg` pool with automated schema initialization.
*   **Caching & Limiter:** Redis (`ioredis`) managing distributed sliding window rate limiting.
*   **Rate Limiting:** Sliding window limiter (200 requests / 15 minutes per IP) applied to `/api/v1/` routes.
*   **Documentation:** Interactive, dark-themed API reference built directly into the server (accessible at root `/`).

---

## 📁 Directory Structure

```
├── src/
│   ├── config/
│   │   └── env.ts           # Environment variable parsing and loading
│   ├── infrastructure/
│   │   ├── database.ts      # PostgreSQL connection pool and migrations
│   │   └── redis.ts         # Redis client pool and health check
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
│   │   └── sessionController.ts
│   ├── routes/
│   │   ├── healthRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   └── index.ts
│   ├── services/
│   │   └── pingService.ts   # Background ping worker
│   ├── app.ts               # Express application configuration
│   └── server.ts            # Server entrypoint
├── static/
│   └── index.html           # Interactive API documentation page
├── tests/                   # Automated Jest unit tests
├── package.json
├── tsconfig.json
└── ecosystem.config.cjs     # PM2 configuration
```

---

## 🛠️ Installation & Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    NODE_ENV=development
    DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable
    REDIS_URL=redis://localhost:6379/0
    PING_URL=
    ```

3.  **Run Locally in Dev Mode:**
    ```bash
    npm run dev
    ```

4.  **Build TypeScript:**
    ```bash
    npm run build
    ```

5.  **Run Tests:**
    ```bash
    npm test
    ```
