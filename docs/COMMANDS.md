# API21 Command Reference

This document provides a comprehensive reference for all available commands in the API21 project.

## 🚀 Quick Start Commands

```bash
# Setup development environment
make setup

# Start development server with hot reload
make dev

# Build the application
make build

# Run tests
make test
```

## 📋 Complete Command Reference

### Using `make` (traditional build system)

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make dev` | Start development server with hot reload |
| `make run` | Run the application |
| `make build` | Build the application |
| `make build-linux` | Build for Linux |
| `make build-windows` | Build for Windows |
| `make build-mac` | Build for macOS |
| `make build-all` | Build for all platforms |
| `make test` | Run tests |
| `make test-coverage` | Run tests with coverage |
| `make bench` | Run benchmarks |
| `make fmt` | Format code |
| `make vet` | Run go vet |
| `make lint` | Run golangci-lint |
| `make deps` | Download dependencies |
| `make tidy` | Tidy dependencies |
| `make vendor` | Create vendor directory |
| `make install` | Install the application |
| `make migrate` | Run database migrations |
| `make clean` | Clean build artifacts |
| `make setup` | Setup development environment |
| `make info` | Show project information |
| `make start` | Build and start application |
| `make stop` | Stop running application |
| `make restart` | Restart application |

### Traditional Go Commands

| Command | Description |
|---------|-------------|
| `go run cmd/server/main.go` | Run application directly |
| `go build -o bin/api21 cmd/server/main.go` | Build manually |
| `go test ./...` | Run tests |
| `go mod tidy` | Tidy dependencies |
| `go fmt ./...` | Format code |
| `go vet ./...` | Run go vet |

## 🔧 Development Tools

### Air (Hot Reload)
Automatically rebuilds and restarts your application when files change.

```bash
# Install Air
go install github.com/air-verse/air@latest

# Run with Air
air
```

### golangci-lint (Code Linting)
Comprehensive Go linter with multiple checks.

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run
```

## 🏗️ Build Options

### Local Development
- `./run.sh dev` - Hot reload with Air
- `./run.sh start` - Run without hot reload

### Production Build
- `./run.sh build` - Single binary for current platform
- `make build-all` - Cross-compile for multiple platforms

### Docker Build
- `docker-compose up` - Development with all services
- `docker build` - Production container

## 📊 Testing Options

### Test Commands
```bash
# Basic tests
./run.sh test
make test

# Tests with coverage
./run.sh test:coverage
make test-coverage

# Benchmarks
make bench

# All tests (using script)
./scripts/test.sh all
```

## 🚀 Deployment

### Quick Deployment
```bash
# Build for production
make build

# Run the binary
./bin/api21
```

### Docker Deployment
```bash
# Build production image
docker build -t api21:latest .

# Run in production
docker run -d -p 3000:3000 --env-file .env api21:latest
```

---

## 💡 Tips

1. **First time setup:** Run `./scripts/setup.sh` to install all tools
2. **Development:** Use `./run.sh dev` for the best development experience
3. **Production:** Use `make build` followed by `./bin/api21`
4. **Docker:** Use `docker-compose up` for full local development environment
5. **Testing:** Use `./run.sh test:coverage` to see test coverage
6. **Formatting:** Run `./run.sh fmt` before committing code

Choose the method that feels most comfortable for your workflow!
