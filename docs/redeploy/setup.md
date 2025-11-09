# Redeploy Setup Instructions

## Initial Setup

### 1. Run Database Migrations

First, ensure the redeployments table is created:

```bash
# Start PostgreSQL if using Docker
docker-compose up -d db

# Wait for database to be ready
docker-compose exec db pg_isready -U api21 -d api21_dev

# Run migrations
buffalo pop migrate up
```

### 2. Verify Migration Success

```bash
# Connect to database
docker-compose exec db psql -U api21 -d api21_dev

# List tables (should see redeployments table)
\dt

# View redeployments schema
\d redeployments

# Exit
\q
```

Expected output:
```
                          List of relations
 Schema |      Name      | Type  | Owner 
--------+----------------+-------+-------
 public | knex_migrations| table | api21
 public | knex_migrations_lock| table | api21
 public | redeployments  | table | api21
 public | users          | table | api21
```

### 3. Configure GitHub Secrets

Add the redeploy URL to your GitHub repository:

```bash
# Navigate to repository settings
# Settings → Secrets and variables → Actions → New repository secret

# Name: REDEPLOY_URL
# Value: https://your-api-server.com
# (or http://localhost:5000 for testing)
```

### 4. Test the Endpoints Locally

Start the development server:

```bash
# In one terminal
make dev
```

In another terminal, test the endpoints:

```bash
# Trigger a redeploy
curl -X POST http://localhost:5000/api/redeploy \
  -H "Content-Type: application/json"

# Response (202 Accepted):
# {
#   "id": "...",
#   "version": 1,
#   "status": "pending",
#   "message": "Redeployment initiated"
# }

# Check deployment status (use version from response)
curl http://localhost:5000/api/redeploy/1

# Response (200 OK):
# {
#   "id": "...",
#   "version": 1,
#   "status": "in_progress",
#   ...
# }
```

### 5. Verify File Structure

After first redeploy, verify the following files exist:

```bash
# Check if .buildversion file was created
cat .buildversion
# Should output: 1

# Check if versioned binary exists
ls -la bin/api21-v*
# Should show: bin/api21-v1 (with appropriate size)
```

### 6. Test Smart Startup

Test the smart startup script:

```bash
# First, stop any running servers
# Then run:
make start-smart

# Should:
# 1. Run migrations
# 2. Check .buildversion file
# 3. Find existing binary or rebuild
# 4. Start the server
```

## Production Deployment

### 1. Build and Deploy Binary

```bash
# Build initial binary
make build

# Or use start which does everything
make start
```

### 2. Start with Smart Script

```bash
# Recommended for production
make start-smart

# This will automatically:
# - Handle version tracking
# - Rebuild if needed
# - Manage binary versioning
```

### 3. Docker Setup

If using Docker:

```yaml
# docker-compose.yml
redeploy_app:
  build: .
  ports:
    - "5000:5000"
  environment:
    - GO_ENV=production
    - PORT=5000
    - DATABASE_URL=postgres://api21:api21_password@db:5432/api21_dev
  command: make start-smart
  depends_on:
    - db
  restart: unless-stopped
  volumes:
    - ./bin:/app/bin
    - ./.buildversion:/app/.buildversion
```

### 4. Health Checks

Verify the deployment:

```bash
# Test API is responding
curl http://localhost:5000/

# Check redeploy endpoint
curl http://localhost:5000/api/redeploy/1

# View deployment logs
make logs  # if using docker-compose
```

## Workflow Integration

### 1. Update Workflow Secret

In GitHub repository settings, add:
```
REDEPLOY_URL = https://your-production-domain.com
```

### 2. Workflow Triggers

The workflow automatically triggers on:
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main` or `develop`

### 3. Monitor Workflow

View workflow executions:
```
GitHub → Actions → CI/CD Tests and Redeploy
```

Each workflow shows:
- Test results
- Redeploy trigger status
- Deployment polling status
- Final result (success/failure)

## Monitoring

### Database Queries

```bash
# Connect to database
docker-compose exec db psql -U api21 -d api21_dev

# Check recent deployments
SELECT version, status, message, error, created_at, completed_at
FROM redeployments
ORDER BY version DESC
LIMIT 10;

# Get deployment statistics
SELECT COUNT(*) as total, status, COUNT(CASE WHEN status='completed' THEN 1 END) as successful
FROM redeployments
GROUP BY status;
```

### Log Files

Check application logs for redeploy process:

```bash
# Development
make dev

# Production
docker-compose logs api21-server

# Watch logs in real-time
docker-compose logs -f api21-server
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Identify the failed version
curl http://your-server.com/api/redeploy/X

# 2. Get previous working version
curl http://your-server.com/api/redeploy/$(( X - 1 ))

# 3. Update .buildversion to previous version
echo "$(( X - 1 ))" > .buildversion

# 4. Restart server
make start-smart

# Server will now use the previous binary
```

## Cleanup

### Remove Old Binaries

To save disk space, remove old versions (keeping last 5):

```bash
# List all versions
ls -lt bin/api21-v* | awk '{print $NF}' | tail -n +6 | xargs rm -f

# Or manually remove old ones
rm -f bin/api21-v1 bin/api21-v2  # Remove versions 1 and 2
```

### Clean Database

To reset deployments (not recommended in production):

```bash
docker-compose exec db psql -U api21 -d api21_dev

# Delete all redeployments
DELETE FROM redeployments;

# Or specific versions
DELETE FROM redeployments WHERE version < 10;

# Verify
SELECT COUNT(*) FROM redeployments;
```

## Testing Checklist

- [ ] Database migrations run successfully
- [ ] `/api/redeploy` endpoint responds with 202 Accepted
- [ ] Version number increments correctly
- [ ] `.buildversion` file is created/updated
- [ ] Binary is built and stored in `bin/`
- [ ] `make start-smart` starts the correct version
- [ ] `/api/redeploy/:version` returns correct status
- [ ] Workflow triggers on push/PR merge
- [ ] Workflow successfully polls deployment status
- [ ] Old binaries don't interfere with new deployments

## Troubleshooting

See `docs/redeploy/troubleshooting.md` for common issues and solutions.
