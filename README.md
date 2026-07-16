# api21 Standalone API Engine

A high-performance standalone REST API engine built with **Go (Golang)**. The frontend was moved to a separate repository, and this project serves exclusively as the API server.

---

## 🚀 Architecture Overview

*   **Language & Framework:** Go (v1.22+) powered by the [Gin Web Framework](https://github.com/gin-gonic/gin).
*   **Database & ORM:** PostgreSQL for relational data persistence managed via [GORM](https://gorm.io).
*   **Caching & Limiter:** Redis connection managing distributed sliding window rate limiting.
*   **Rate Limiting:** Sliding window limiter (200 requests / 15 minutes per IP) applied to `/api/` paths.
*   **Documentation:** Interactive, responsive dark-themed API reference built directly into the server (accessible at the root `/`).
*   **Process Management:** PM2 configuration managing the compiled Go binary.

---

## 📁 Directory Structure

```
├── cmd/
│   └── app/
│       └── main.go         # Application bootstrap entrypoint
├── config/
│   └── config.go       # Environment variable parsing and loading
├── db/
│   └── db.go           # GORM connection and Postgres migrations
├── handlers/
│   ├── health.go       # Health probe handler (Postgres + Redis checks)
│   ├── health_test.go  # Route unit tests for health status
│   └── user.go         # User CRUD handlers (GORM integration)
├── middleware/
│   ├── cors.go         # CORS headers middleware for separate frontend repo
│   ├── logger.go       # Logger middleware
│   ├── ratelimit.go    # Redis-backed sliding window rate limiter
│   └── ssl.go          # HTTPS force redirect middleware
├── models/
│   └── user.go         # GORM database model schemas
├── redis/
│   └── redis.go        # Redis client pool and connectivity verification
├── services/
│   └── ping.go         # Background ping routine worker
├── static/
│   └── index.html      # Glassmorphic interactive API documentation page
├── ecosystem.config.cjs # PM2 ecosystem configuration for Go binary
└── go.mod / go.sum     # Go dependency manager manifest files
```

---

## 🛠️ Installation & Setup

1.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    GO_ENV=development
    DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable
    REDIS_URL=redis://localhost:6379/0
    PING_URL=
    ```

2.  **Download dependencies:**
    ```bash
    go mod tidy
    ```

3.  **Run Locally in Dev Mode:**
    - Standard run:
      ```bash
      go run cmd/app/main.go
      ```
    - Live auto-reload (using installed `air` watcher):
      ```bash
      # Add ~/go/bin to path if needed
      export PATH=$PATH:~/go/bin
      air
      ```
    Open [http://localhost:8080](http://localhost:8080) to view the interactive API Documentation sandbox.

4.  **Run Local Tests:**
    ```bash
    go test ./...
    ```

---

## 📦 Production Deployment (Systemd on EC2)

Deploy the Go binary using native Linux `systemd` to ensure automatic restarts and robust logging without requiring Node.js/PM2.

1.  **Compile Go Binary:**
    ```bash
    go build -o bin/server ./cmd/app
    ```

2.  **Create Systemd Service:**
    Create a file at `/etc/systemd/system/api21.service`:
    ```ini
    [Unit]
    Description=api21 Go Backend Service
    After=network.target postgresql.service redis.service

    [Service]
    User=ubuntu
    Group=ubuntu
    WorkingDirectory=/home/ubuntu/api21
    ExecStart=/home/ubuntu/api21/bin/server
    Restart=always
    RestartSec=5s

    # Standard Output/Error is automatically captured by journald
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=api21

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Start and Enable Service:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable api21.service
    sudo systemctl start api21.service
    ```

4.  **Check Logs:**
    ```bash
    sudo journalctl -u api21.service -f
    ```
