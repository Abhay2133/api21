# Redeploy Feature Documentation

## Overview

The redeploy feature provides automated deployment management through a REST API endpoint. When triggered (typically by GitHub workflow on push or PR merge), it performs a complete redeploy cycle:

1. **Generates a unique version number** - Sequential integer index for each deployment
2. **Pulls the latest code** - Fetches from the main branch
3. **Rebuilds the binary** - Compiles the application with version information
4. **Updates build version tracking** - Stores the version in `.buildversion` file
5. **Provides deployment state visibility** - Database tracking and status polling

## Architecture

### Redeploy Flow

```
GitHub Workflow (push/PR merge)
    ↓
    → Runs tests
    ↓
    → Triggers /api/redeploy endpoint (POST)
    ↓
    → Returns 202 Accepted with version number
    ↓
    → Starts async redeploy process
    ↓
    → Workflow polls /api/redeploy/:version (GET)
    ↓
    → Updates database with status
    ↓
    → Completes (success/failed)
```

### Database Schema

The `redeployments` table tracks deployment state:

```sql
CREATE TABLE redeployments (
    id UUID PRIMARY KEY,
    version INTEGER UNIQUE,
    status VARCHAR (default: 'pending'),
    message TEXT NULL,
    error TEXT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_redeployments_version;
CREATE INDEX idx_redeployments_status;
CREATE INDEX idx_redeployments_created_at;
```

**Status Values:**
- `pending` - Deployment queued, not started
- `in_progress` - Deployment currently running
- `completed` - Deployment finished successfully
- `failed` - Deployment encountered an error

## API Endpoints

### Trigger Redeploy

**POST /api/redeploy**

Initiates a new redeploy process.

**Response (202 Accepted):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "status": "pending",
  "message": "Redeployment initiated"
}
```

**Error Response (500):**
```json
{
  "error": "failed to create redeployment record"
}
```

---

### Get Redeploy Status

**GET /api/redeploy/:version**

Retrieves the current status of a deployment by version number.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "status": "completed",
  "message": "Build version file updated",
  "error": null,
  "started_at": "2025-11-09T12:30:45Z",
  "completed_at": "2025-11-09T12:35:20Z",
  "created_at": "2025-11-09T12:30:40Z",
  "updated_at": "2025-11-09T12:35:20Z"
}
```

**Error Response (400):**
```json
{
  "error": "invalid version number"
}
```

**Error Response (404):**
```json
{
  "error": "redeployment not found"
}
```

## Setup & Configuration

### Environment Variables

Set the redeploy server URL for GitHub Actions:

```bash
# In GitHub repository settings (Settings → Secrets and variables → Actions)
REDEPLOY_URL=https://your-api-server.com
```

### File Structure

After redeploy, binaries are stored with version numbers:

```
bin/
├── api21-v0         # Initial deployment
├── api21-v1         # First redeploy
├── api21-v2         # Second redeploy
└── ...

.buildversion        # Contains current version number
```

### Database Migration

The redeploy feature requires the redeployments table:

```bash
# Run migrations (automatic on server start)
buffalo pop migrate up

# Or manually
make migrate-up
```

## Usage

### Manual Trigger

Trigger a redeploy manually:

```bash
curl -X POST https://your-api-server.com/api/redeploy \
  -H "Content-Type: application/json"
```

### Check Deployment Status

```bash
# Check deployment version 1
curl https://your-api-server.com/api/redeploy/1

# Response shows current status, timing, and any errors
```

### Server Startup

The application includes smart startup logic that handles version tracking:

```bash
# Smart startup (recommended for production)
make start-smart

# This script:
# 1. Runs migrations
# 2. Checks .buildversion file
# 3. Looks for versioned binary in bin/ directory
# 4. Rebuilds if binary doesn't exist
# 5. Starts the server with appropriate version
```

## GitHub Workflow Integration

### Workflow File

The CI/CD workflow (`.github/workflows/ci-cd.yml`) includes:

1. **Test Job** - Runs all tests
2. **Redeploy Job** - Triggers after tests pass on push to main/develop

### Workflow Features

- **Automatic Triggering**: On push to main or develop branch
- **Sequential Execution**: Redeploy only runs after tests pass
- **Polling**: Monitors deployment status with exponential backoff
- **Visibility**: Shows deployment progress and status in workflow logs
- **Error Handling**: Detailed error messages if deployment fails

### Deployment Polling Logic

```
Trigger /api/redeploy
    ↓ Wait for 202 response
    ↓ Extract version number
    ↓ Poll /api/redeploy/:version
        ↓ Every 2 seconds
        ↓ Max 120 attempts (4 minutes)
        ↓ Check status field
            ├─ "pending"     → Continue polling
            ├─ "in_progress" → Continue polling
            ├─ "completed"   → Success ✓
            └─ "failed"      → Failure ✗
```

## Redeploy Process Details

### Step 1: Version Generation

- Query database for highest existing version
- Increment by 1 for new deployment
- Example: If version 5 exists, next is 6

### Step 2: Repository Pull

```bash
git pull origin main
```

- Fetches latest code from main branch
- Updates local repository

### Step 3: Binary Rebuild

```bash
buffalo build -o bin/api21-v{VERSION}
```

- Compiles application with version number
- Binary stored as `api21-v1`, `api21-v2`, etc.
- Allows multiple versions to coexist

### Step 4: Version File Update

```bash
echo "{VERSION}" > .buildversion
```

- Updates `.buildversion` file with current version
- Used by startup script for next server restart

### Step 5: Status Tracking

- Database record updated at each step
- Success: status = "completed"
- Failure: status = "failed" with error message

## Database Queries

### Get Latest Deployment

```sql
SELECT * FROM redeployments
ORDER BY version DESC
LIMIT 1;
```

### Check Active Deployments

```sql
SELECT * FROM redeployments
WHERE status IN ('pending', 'in_progress')
ORDER BY created_at DESC;
```

### Get Failed Deployments

```sql
SELECT * FROM redeployments
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Deployment Timeline

```sql
SELECT version, status, created_at, completed_at,
       EXTRACT(EPOCH FROM (completed_at - started_at))::INT as duration_seconds
FROM redeployments
WHERE completed_at IS NOT NULL
ORDER BY version DESC
LIMIT 10;
```

## Troubleshooting

### Deployment Stuck in "pending" or "in_progress"

Check server logs:
```bash
docker logs api21-server
```

Resume by querying database:
```sql
UPDATE redeployments
SET status = 'failed', error = 'Manual failure: restarting deployment'
WHERE status IN ('pending', 'in_progress')
AND version = <VERSION>;
```

### Binary Not Found After Deployment

Check bin directory:
```bash
ls -la bin/
cat .buildversion
```

Verify the version matches:
```bash
# Should have file matching version
ls -la bin/api21-v$(cat .buildversion)
```

### GitHub Workflow Timeout

Check redeploy server status:
```bash
curl https://your-api-server.com/

# If down, restart:
make start-smart
```

### Migration Failures

Check database connectivity:
```bash
# Verify PostgreSQL is running
docker-compose ps db

# Manually run migrations
buffalo pop migrate up
```

## Performance Considerations

- **Deployment Time**: Typically 30-60 seconds
- **Polling Overhead**: Minimal (every 2 seconds)
- **Database Load**: Light (one update per status change)
- **Binary Size**: Each version stored separately (~20-50MB typically)

## Security Notes

- The `/api/redeploy` endpoint is unauthenticated (assumes private network)
- For public servers, add authentication/authorization middleware
- Consider rate limiting to prevent abuse
- Use HTTPS in production (enforced by `forceSSL()`)

## Related Documentation

- See `docs/redeploy/setup.md` for detailed setup instructions
- See `docs/redeploy/troubleshooting.md` for common issues and solutions
- See `.github/workflows/ci-cd.yml` for workflow configuration

## Common Commands

```bash
# View redeploy history
sqlite3 database.db "SELECT * FROM redeployments ORDER BY version DESC;"

# Check current version
cat .buildversion

# List all built versions
ls -la bin/ | grep api21-v

# Manually trigger redeploy
curl -X POST http://localhost:5000/api/redeploy

# Check specific deployment
curl http://localhost:5000/api/redeploy/1

# View deployment logs
make dev    # Development mode with hot-reload

# Production startup with version tracking
make start-smart
```
