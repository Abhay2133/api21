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

### 🔑 GitHub Actions Secrets Setup

To enable automated CI/CD deployment via GitHub Actions, add the following Secrets under your GitHub repository (**Settings > Secrets and variables > Actions > New repository secret**):

| Secret Name | Description / How to Get It |
| :--- | :--- |
| `SERVER_HOST` | **The Public IPv4 Address or DNS name of your EC2 instance.**<br>• *How to get:* In your AWS EC2 Console, select your active instance and copy the **Public IPv4 address** or **Public IPv4 DNS** from the *Instance Details* tab. |
| `SERVER_USER` | **The SSH login user for the EC2 instance.**<br>• *How to get:* Depends on the AMI you launched your instance with. Typical default users are:<br>  - Ubuntu: `ubuntu`<br>  - Amazon Linux 2 / 2023: `ec2-user`<br>  - Debian: `admin`<br>  - CentOS: `centos` |
| `SSH_PRIVATE_KEY` | **The private key (.pem) used to authenticate with your EC2 instance.**<br>• *How to get:* Locate the Key Pair file (`.pem`) you created/downloaded when launching the EC2 instance. Open this file in any raw text editor, copy its entire contents (including headers `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`), and paste it as the secret value. |

---

### ⚙️ EC2 Manual Setup Guide
Deploy the Go binary using native Linux `systemd` to ensure automatic restarts and robust logging without requiring Node.js/PM2.

1.  **Compile Go Binary:**
    ```bash
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o bin/api21_server cmd/app/main.go
    ```

2.  **Configure Environment Variables on EC2:**
    Create a `.env` file in the working directory on your EC2 instance (`/home/ubuntu/api21/.env`) with your production variables:
    ```env
    PORT=8080
    GO_ENV=production
    DATABASE_URL=postgres://<db_user>:<db_password>@<db_host>:5432/<db_name>?sslmode=require
    REDIS_URL=redis://localhost:6379/0
    MASTER_CREDENTIALS=admin:securepassword
    ADMIN_ORIGIN=https://admin.yourdomain.com
    ```

3.  **Create Systemd Service:**
    Create a file at `/etc/systemd/system/api21.service`:
    ```ini
    [Unit]
    Description=api21 Go Backend Service
    After=network.target postgresql.service redis.service

    [Service]
    User=ubuntu
    Group=ubuntu
    WorkingDirectory=/home/ubuntu/api21
    ExecStart=/home/ubuntu/api21/bin/api21_server
    Restart=always
    RestartSec=5s

    # Standard Output/Error is automatically captured by journald
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=api21

    [Install]
    WantedBy=multi-user.target
    ```

4.  **Start and Enable Service:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable api21.service
    sudo systemctl start api21.service
    ```

5.  **Check Logs:**
    ```bash
    sudo journalctl -u api21.service -f
    ```

6.  **Configure and Reload Nginx Reverse Proxy:**
    To support reverse proxying HTTP requests and WebSocket connections (for the WebTerminal dashboard feature), merge the configuration from [nginx.conf.example](file:///home/abhay/pj/api21/nginx.conf.example) into your Nginx site configuration, and then run the following commands to test and apply the configuration:
    ```bash
    # Test the configuration file for syntax errors
    sudo nginx -t

    # Reload Nginx to apply changes (keeps existing connections alive)
    sudo systemctl reload nginx
    ```
