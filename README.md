# API21 - GoLang Fiber Project

A modern REST API built with Go Fiber framework, featuring a clean architecture and best practices.

## 🏗️ Project Structure

```
api21/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go           # Configuration management
│   ├── database/
│   │   └── database.go         # Database connection and migrations
│   ├── handlers/
│   │   └── handlers.go         # HTTP request handlers
│   ├── middleware/
│   │   └── middleware.go       # Custom middleware
│   ├── models/
│   │   └── models.go           # Data models and structures
│   └── routes/
│       └── routes.go           # Route definitions
├── pkg/
│   └── utils/
│       └── utils.go            # Utility functions
├── docs/
├── scripts/
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── go.mod                      # Go module definition
├── go.sum                      # Go module checksums
└── README.md                   # Project documentation
```

## 🚀 Features

- **Clean Architecture**: Well-organized code structure following Go best practices
- **Fiber Framework**: Fast HTTP web framework built on top of Fasthttp
- **Environment Configuration**: Flexible configuration management with .env support
- **Database Integration**: GORM ORM with PostgreSQL support
- **Middleware Support**: CORS, Logger, Recovery, and custom middleware
- **RESTful API**: Standard REST endpoints with proper HTTP methods
- **Error Handling**: Centralized error handling with custom error responses
- **Utility Functions**: Common helper functions for password hashing, validation, etc.

## 📋 Prerequisites

- Go 1.21 or higher
- PostgreSQL (optional, for database features)
- Git

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd api21
   ```

2. **Quick setup (recommended):**
   ```bash
   ./scripts/setup.sh
   ```

3. **Manual setup:**
   ```bash
   go mod tidy
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🚀 Quick Start

### Using the run script (npm-like experience):
```bash
./run.sh dev          # Start development server with hot reload
./run.sh build        # Build the application
./run.sh test         # Run tests
./run.sh help         # Show all available commands
```

### Using Makefile:
```bash
make dev              # Start development server with hot reload
make build            # Build the application
make test             # Run tests
make help             # Show all available commands
```

### Traditional Go commands:
```bash
go run cmd/server/main.go     # Run directly
go build -o bin/api21 cmd/server/main.go  # Build manually
```

## 🌐 API Endpoints

### Health Check
- `GET /health` - Check API status

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Items (Example Resource)
- `GET /api/v1/items` - Get all items with pagination
- `GET /api/v1/items/:id` - Get item by ID
- `POST /api/v1/items` - Create new item
- `PUT /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item

## 🧪 Development

### Quick Commands

**Using run.sh script:**
```bash
./run.sh dev                    # Development with hot reload
./run.sh build                  # Build application
./run.sh test                   # Run tests
./run.sh test:coverage          # Run tests with coverage
./run.sh lint                   # Run linter
./run.sh fmt                    # Format code
./run.sh clean                  # Clean build artifacts
./run.sh setup                  # Setup dev environment
```

**Using Makefile:**
```bash
make dev                        # Development with hot reload
make build                      # Build application
make test                       # Run tests
make test-coverage              # Run tests with coverage
make lint                       # Run linter
make fmt                        # Format code
make clean                      # Clean build artifacts
make setup                      # Setup dev environment
```

### Development Tools

- **Hot Reload:** Uses Air (github.com/air-verse/air) for automatic recompilation on file changes
- **Code Formatting:** gofmt and gofumpt for consistent code style
- **Linting:** golangci-lint for code quality checks
- **Testing:** Built-in Go testing with coverage reports
- **Docker:** Full Docker and Docker Compose support

### Building for Production
```bash
# Single platform
make build
./run.sh build

# Multiple platforms
make build-all              # Build for Linux, Windows, and macOS
make build-linux           # Build for Linux only
make build-windows         # Build for Windows only
make build-mac             # Build for macOS only
```

## � Docker Support

### Using Docker Compose (Recommended for Development)
```bash
# Start all services (API + PostgreSQL + Redis + PgAdmin)
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Using Docker (Production)
```bash
# Build image
docker build -t api21:latest .
# or
make docker-build

# Run container
docker run -p 3000:3000 --env-file .env api21:latest
# or
make docker-run
```

### Services in Docker Compose
- **API:** Your Fiber application (port 3000)
- **PostgreSQL:** Database (port 5432)
- **Redis:** Caching/sessions (port 6379)
- **PgAdmin:** Database admin interface (port 8080)
  - Email: admin@api21.com
  - Password: admin

## �📊 Database

The project uses GORM as the ORM with PostgreSQL. To set up the database:

1. Install PostgreSQL
2. Create a database named `api21_db`
3. Update the database configuration in `.env`
4. Run the application (migrations will run automatically)

## 🔧 Configuration

Environment variables can be configured in the `.env` file:

- `PORT`: Server port (default: 3000)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_SSLMODE`: Database SSL mode

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

If you have any questions or need help, please open an issue or contact the maintainers.

---

**Happy Coding! 🚀**
