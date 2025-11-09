# Quick Start: Redeploy Feature

## 🚀 Get Started in 5 Minutes

### 1. Run Database Migration
```bash
buffalo pop migrate up
```

### 2. Test the Endpoint Locally
```bash
# Terminal 1: Start the dev server
buffalo dev

# Terminal 2: Trigger a redeploy
curl -X POST http://localhost:5000/api/redeploy \
  -H "Content-Type: application/json"

# You should get:
# {"id":"...","version":1,"status":"pending","message":"Redeployment initiated"}
```

### 3. Check Deployment Status
```bash
# Poll the status (will show as "in_progress" then "completed")
curl http://localhost:5000/api/redeploy/1 | jq '.'
```

### 4. Verify Files Created
```bash
# Check if binary was built with version
ls -la bin/ | grep api21-v

# Check version file
cat .buildversion

# Check database record
docker-compose exec db psql -U api21 -d api21_dev -c \
  "SELECT version, status, message FROM redeployments ORDER BY version DESC LIMIT 1;"
```

### 5. Configure GitHub (for CI/CD)
```
1. Go to: GitHub Repository Settings
2. Navigate to: Secrets and variables → Actions
3. Click: New repository secret
4. Name: REDEPLOY_URL
5. Value: https://your-api-server.com (or http://localhost:5000 for testing)
6. Click: Add secret
```

### 6. Push to Main to Trigger Workflow
```bash
git add .
git commit -m "Add redeploy feature"
git push origin main

# Go to GitHub Actions tab to watch the workflow
```

## 📋 What Happens

When you trigger `/api/redeploy` or GitHub Actions does:

1. ✅ **Generate Version** - Auto-increment (1, 2, 3, ...)
2. ✅ **Pull Code** - `git pull origin main`
3. ✅ **Rebuild Binary** - `buffalo build -o bin/api21-v{VERSION}`
4. ✅ **Update Version File** - Echo version to `.buildversion`
5. ✅ **Track in Database** - Record status and timing
6. ✅ **Return Status** - Through polling endpoint

## 🔧 Production Startup

Use the smart startup script that handles versioning:

```bash
make start-smart
```

This script:
- Runs migrations automatically
- Checks `.buildversion` file for current version
- Finds and validates the binary
- Starts the server with correct version

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| [README.md](../../README.md#-redeploy-feature) | Quick overview in main README |
| [docs/redeploy/README.md](../redeploy/README.md) | Complete reference documentation |
| [docs/redeploy/setup.md](../redeploy/setup.md) | Detailed setup instructions |
| [docs/redeploy/troubleshooting.md](../redeploy/troubleshooting.md) | Troubleshooting guide |
| [docs/redeploy/examples.md](../redeploy/examples.md) | Code examples (JS, Python, etc.) |
| [.github/workflows/SETUP.md](.../../.github/workflows/SETUP.md) | GitHub Actions setup |

## 🧪 Quick Tests

```bash
# Test database operations
buffalo test ./models -v

# Test API endpoints
buffalo test ./actions -v

# Test everything with coverage
buffalo test -cover

# Smart startup test
bash scripts/start-smart.sh
```

## 🐛 Troubleshooting

### "redeployment not found" error
- The deployment hasn't been created yet. Trigger first: `curl -X POST http://localhost:5000/api/redeploy`

### "git pull failed" error
- Check git status: `git status`
- May be in detached HEAD state: `git checkout main`

### "buffalo build failed" error
- Check logs: `buffalo build -o bin/test-build 2>&1`
- Verify dependencies: `go mod tidy`

### ".buildversion file not found"
- This is normal on first run. The script creates it automatically.

## 📊 API Reference

### POST /api/redeploy
Trigger a new deployment
- Status: **202 Accepted**
- Returns: `{id, version, status, message}`

### GET /api/redeploy/:version
Check deployment status
- Status: **200 OK** (found), **404 Not Found** (missing)
- Returns: Full deployment record with timestamps

## 🔐 Security Note

The redeploy endpoints are currently unauthenticated (assumes private network).

For production with public internet:
1. Add authentication middleware
2. Implement rate limiting
3. Use HTTPS only (enabled by default in production)
4. Whitelist IP addresses if needed

## 📊 Database Schema

```sql
CREATE TABLE redeployments (
  id UUID PRIMARY KEY,
  version INTEGER UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

Status values: `pending` → `in_progress` → `completed` or `failed`

## 🚀 Next Steps

1. **Test locally** - Run migrations, test endpoints
2. **Configure GitHub** - Add REDEPLOY_URL secret
3. **Push code** - Trigger workflow on main branch
4. **Monitor workflow** - Check GitHub Actions tab
5. **Verify deployment** - Check server and database
6. **Set up monitoring** - Track future deployments

## 💡 Tips

- **Disk Space**: Old binaries are kept. Clean up periodically: `ls -t bin/api21-v* | tail -n +6 | xargs rm -f`
- **Polling Timeout**: Workflow waits up to 4 minutes for deployment to complete
- **Binary Versions**: Each deployment gets a new binary (v0, v1, v2, ...)
- **Database Records**: Every deployment attempt is logged for audit trail
- **Version File**: `.buildversion` determines which binary runs on startup

## ⚡ Common Commands

```bash
# Trigger redeploy
curl -X POST http://localhost:5000/api/redeploy

# Check status
curl http://localhost:5000/api/redeploy/1

# View deployment history
docker-compose exec db psql -U api21 -d api21_dev \
  -c "SELECT version, status, created_at FROM redeployments ORDER BY version DESC;"

# List built versions
ls -la bin/api21-v*

# Start server with smart startup
make start-smart

# Clean old binaries (keep last 5)
ls -t bin/api21-v* | tail -n +6 | xargs rm -f
```

---

**Ready to deploy?** Start with: `buffalo pop migrate up` ✨
