# Code Style Guide & Architecture Specifications

This document outlines the architectural patterns, coding standards, and SOLID principles implemented in the `api21` monorepo codebase.

---

## 1. Architectural Structure (Modular Monorepo Architecture)

The repository is organized into workspace apps and shared packages:

```text
apps/
├── api/                     # Backend REST API (@api21/api)
│   ├── src/
│   │   ├── app.module.ts    # Root NestJS application module
│   │   ├── app.factory.ts   # Application factory
│   │   ├── main.ts          # HTTP bootstrap entrypoint
│   │   ├── worker.ts        # Standalone BullMQ worker bootstrap
│   │   ├── core/            # DatabaseModule, RedisModule, BullMQModule
│   │   ├── common/          # Guards, filters, interceptors, middleware
│   │   └── modules/         # Feature modules (users, sessions, jobs, webhooks, health)
│   ├── static/              # Interactive API documentation page
│   └── tests/               # Automated test suites
├── chat/                    # Chat application (@api21/chat)
│   └── src/index.ts
└── admin/                   # Admin dashboard (@api21/admin)
    └── src/index.ts

packages/
└── types/                   # Shared types, DTOs & interfaces (@api21/types)
    └── src/                 # CreateUserDto, CreateSessionDto, EnqueueJobDto, etc.
```

---

## 2. Core SOLID Implementation Principles

### I. Single Responsibility Principle (SRP)
* **Rule**: Each module, service, controller, guard, or interceptor must have one, and only one, reason to change.
* **Practice**:
  * Controllers handle HTTP routing, request validation, and status codes.
  * Services encapsulate domain and business logic.
  * Core modules encapsulate connection pools and database lifecycle management.
  * Guards handle authorization and rate-limiting before requests enter controllers.

### II. Dependency Inversion & Injection (DIP)
* **Rule**: High-level modules should depend on abstractions and central providers via Dependency Injection.
* **Practice**:
  * Services inject `DatabaseService`, `RedisService`, and `BullMQService` via constructor injection (`@Injectable()`).
  * Shared types and DTOs are centralized in `@api21/types` and consumed by all apps.

### III. Interface Segregation & Strong Typing
* **Rule**: Avoid `any` types and ensure strict typing across DTOs and database queries.
* **Practice**:
  * DTOs use `class-validator` and `class-transformer` decorators for strict runtime request validation.
  * All database queries and responses are strongly typed.

---

## 3. Strict Coding Conventions

* **No `var` Declarations**: Always use `const` (preferred) or `let` (if reassignment is required).
* **Strict Equality**: Always use triple-equals (`===` and `!==`) to prevent type coercion bugs.
* **Explicit Braces**: All control blocks (`if`, `else`, `for`, `while`) must use block curly braces `{}`.

### Development Commands
* Run test suites:
  ```bash
  pnpm test
  ```
* Compile production build:
  ```bash
  pnpm build
  ```
