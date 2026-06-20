# Code Style Guide & Architecture Specifications

This document outlines the architectural patterns, coding standards, and SOLID principles implemented in the `api21` TypeScript/Express/Bun server codebase.

---

## 1. Architectural Structure (Clean Layered Architecture)

The TypeScript backend uses a modular, layered architecture to maintain clear boundaries between configuration, infrastructure details (e.g., Express, SQLite, Redis), and routing handlers. All backend code resides within the `server/` directory:

```text
server/
├── config/                 # Domain/Infrastructure configurations (DIP)
│   ├── env.ts              # Strongly typed environment schema
│   ├── database.ts         # Bun SQLite & Drizzle ORM setup
│   └── redis.ts            # Redis client singleton setup
├── middlewares/            # Request processing filters (SRP)
│   ├── logger.middleware.ts
│   ├── ssl.middleware.ts
│   └── rateLimiter.middleware.ts
├── controllers/            # Route controllers & handlers (Presentation layer)
│   ├── health.controller.ts
│   └── ssr.controller.ts
├── services/               # Internal services & background workers
│   └── ping.service.ts
├── app.ts                  # Express application builder and middleware pipeline
└── db/                     # Database migrations & schemas
    └── schema.ts           # Drizzle table schemas
```

---

## 2. Core SOLID Implementation Principles

### I. Single Responsibility Principle (SRP)
* **Rule**: Each module, class, or function must have one, and only one, reason to change.
* **Practice**:
  * The Express app configuration ([server/app.ts](file:///home/abhay/projects/PP/api21/server/app.ts)) focuses *only* on middleware composition and route registration. It does not handle environment validation or DB queries.
  * Middleware filters (e.g., rate limiting) handle *only* request preprocessing and forward control to the next step.

### II. Dependency Inversion Principle (DIP)
* **Rule**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
* **Practice**:
  * Instead of modules instantiating client connections inline, dependencies (like the Redis client or Vite instance) are queried from central providers ([server/config/redis.ts](file:///home/abhay/projects/PP/api21/server/config/redis.ts)) or passed via dependency injection parameter pools.

### III. Interface Segregation & Strong Typing
* **Rule**: Avoid client dependencies on fat signatures.
* **Practice**:
  * Avoid raw `any` types. Ensure third-party instances (e.g. `ViteDevServer`, Express requests/responses, Node `Server` instances) are strictly typed using their respective type libraries.
  * Error boundary `catch (err)` variables must be cast to `unknown` and verified using typescript guards (`err instanceof Error`).

---

## 3. Strict Coding Conventions

Code formatting and style rules are strictly checked via ESLint.

### Variable & Type Scoping
* **No `var` Declarations**: Always use `const` (preferred) or `let` (if reassignment is required).
* **Strict Equality**: Always use triple-equals (`===` and `!==`) to prevent JavaScript type coercion bugs.
* **Explicit Braces**: Forbid inline single-line loops or conditionals. All control blocks (`if`, `else`, `for`, `while`) must use block curly braces `{}`.

### Linter Commands
* Run lint checks over the codebase:
  ```bash
  bun run lint
  ```
* Format validation runs automatically as part of compiling the production release:
  ```bash
  bun run build
  ```
