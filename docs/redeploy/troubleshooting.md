# Redeploy Troubleshooting Guide

## Common Issues and Solutions

### Issue: Deployment Status Stuck in "pending"

**Symptom:** Deployment initiated but status never changes from "pending"

**Causes:**
1. Redeploy process crashed unexpectedly
2. Server is overloaded or unresponsive
3. Git pull command failed silently

**Solutions:**

```bash
# 1. Check if server is running
curl http://localhost:5000/

# 2. Check application logs
docker-compose logs api21-server
make dev

# 3. If stuck, force update status
docker-compose exec db psql -U api21 -d api21_dev

UPDATE redeployments
SET status = 'failed', error = 'Process timeout or crash detected'
WHERE version = X AND status = 'pending';

# 4. Restart server
make start-smart

# 5. Try deployment again
curl -X POST http://localhost:5000/api/redeploy
```

---

### Issue: Binary Not Found After Deployment

**Symptom:** Server fails to start after deployment shows "completed"

**Causes:**
1. Build failed but status updated incorrectly
2. Binary path mismatch
3. Permission issues

**Solutions:**

```bash
# 1. Check if binary exists
ls -la bin/
cat .buildversion

# 2. Verify binary has correct permissions
chmod +x bin/api21-v$(cat .buildversion)

# 3. Check git repository state
git status
git log --oneline -5

# 4. Try manual build
buffalo build -o bin/api21-v1

# 5. If build fails, check logs
buffalo build -o bin/api21-v1 2>&1

# 6. Update database record
docker-compose exec db psql -U api21 -d api21_dev

UPDATE redeployments
SET status = 'failed', error = 'Binary build failed - check application logs'
WHERE version = X;
```

---

### Issue: "git pull origin main" Fails

**Symptom:** Redeploy status shows "failed" with git error

**Causes:**
1. Repository is in detached HEAD state
2. Local changes conflict with remote
3. No network access to GitHub
4. SSH key not configured

**Solutions:**

```bash
# 1. Check git status
git status

# 2. If detached HEAD, switch to main
git checkout main

# 3. If conflicts exist, resolve them
git merge --abort

# 4. Force clean state
git fetch origin
git reset --hard origin/main

# 5. Verify network connectivity
ping github.com
ssh -T git@github.com

# 6. Check SSH key
ssh-add -l

# 7. For HTTPS, verify credentials
git config credential.helper
```

---

### Issue: Database Migration Fails on Server Start

**Symptom:** `make start-smart` fails with migration error

**Causes:**
1. Database not running
2. Redeployments table not created
3. Connection string incorrect
4. Migrations corrupted

**Solutions:**

```bash
# 1. Check if PostgreSQL is running
docker-compose ps db
docker-compose up -d db

# 2. Wait for database to be ready
docker-compose exec db pg_isready -U api21 -d api21_dev

# 3. Test database connection
psql postgres://api21:api21_password@localhost:5432/api21_dev

# 4. Check if redeployments table exists
docker-compose exec db psql -U api21 -d api21_dev

\dt redeployments

# If not found, create manually:
docker-compose exec db psql -U api21 -d api21_dev <<EOF
CREATE TABLE IF NOT EXISTS redeployments (
  id UUID PRIMARY KEY,
  version INTEGER UNIQUE,
  status VARCHAR DEFAULT 'pending',
  message TEXT,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX idx_redeployments_version ON redeployments(version);
CREATE INDEX idx_redeployments_status ON redeployments(status);
CREATE INDEX idx_redeployments_created_at ON redeployments(created_at);
EOF

# 5. Manually run migrations
buffalo pop migrate up

# 6. Check migration status
buffalo pop migrate status
```

---

### Issue: GitHub Workflow Timeout

**Symptom:** Workflow hangs on "Polling deployment status" step

**Causes:**
1. Server is not responding
2. Deployment takes longer than expected
3. Network connectivity issue

**Solutions:**

```bash
# 1. Check if server is running
curl https://your-api-server.com/

# 2. Check server logs
ssh user@server
make logs

# 3. If server is down, restart
make start-smart

# 4. Check if endpoint is accessible
curl https://your-api-server.com/api/redeploy/1

# 5. Increase polling timeout in workflow
# Edit .github/workflows/ci-cd.yml
# Change MAX_POLLS from 120 to higher value

# 6. Check for SSL/TLS issues
curl -v https://your-api-server.com/

# 7. If behind proxy, verify headers
curl -H "X-Forwarded-Proto: https" https://your-api-server.com/
```

---

### Issue: "HTTP 500" from /api/redeploy Endpoint

**Symptom:** Redeploy endpoint returns 500 error

**Causes:**
1. Database connection failed
2. Transaction error
3. UUID generation failed
4. Unexpected exception

**Solutions:**

```bash
# 1. Check application logs
docker-compose logs api21-server | tail -50

# 2. Test database connection
docker-compose exec db pg_isready -U api21 -d api21_dev

# 3. Check if redeployments table exists
docker-compose exec db psql -U api21 -d api21_dev -c "\dt redeployments"

# 4. Verify application state
curl http://localhost:5000/

# 5. Restart application
docker-compose restart api21-server

# 6. Check memory/resource usage
docker stats api21-server

# 7. If persistent, rebuild
buffalo build
make start-smart

# 8. Check for recent code changes
git diff HEAD~1
git log --oneline -5
```

---

### Issue: Deployment Status Returns 404

**Symptom:** `/api/redeploy/X` returns "redeployment not found"

**Causes:**
1. Version number doesn't exist
2. Database query issue
3. Wrong version number used

**Solutions:**

```bash
# 1. Check what versions exist
docker-compose exec db psql -U api21 -d api21_dev

SELECT version FROM redeployments ORDER BY version DESC;

# 2. Use existing version number
# If versions 1-5 exist, use: curl http://localhost:5000/api/redeploy/5

# 3. If no versions exist, trigger first redeploy
curl -X POST http://localhost:5000/api/redeploy

# 4. Extract version from response
curl -X POST http://localhost:5000/api/redeploy | jq '.version'

# 5. Use extracted version to check status
VERSION=$(curl -s -X POST http://localhost:5000/api/redeploy | jq -r '.version')
curl http://localhost:5000/api/redeploy/$VERSION
```

---

### Issue: Build Version File (.buildversion) Missing

**Symptom:** `make start-smart` tries to build but .buildversion doesn't exist

**This is expected behavior** on first run. The script will:
1. Build initial binary as `api21-v0`
2. Create `.buildversion` file with content "0"
3. Start the server

No action needed - this is normal.

---

### Issue: Multiple Versions Don't Coexist

**Symptom:** Old version binary deleted or overwritten

**Causes:**
1. Build command overwrites previous binary
2. Disk cleanup script removed versions
3. Version number collision

**Solutions:**

```bash
# 1. Verify versioned binaries are unique
ls -la bin/ | grep api21-v

# 2. Check last 10 deployments
docker-compose exec db psql -U api21 -d api21_dev

SELECT version, created_at FROM redeployments ORDER BY version DESC LIMIT 10;

# 3. Rebuild missing versions if needed
VERSION=1
buffalo build -o bin/api21-v$VERSION

# 4. Prevent future cleanup with proper script
# Don't delete binaries that match database records
```

---

### Issue: Deployment Takes Too Long

**Symptom:** Deployment process takes more than 5 minutes

**Causes:**
1. Network is slow
2. Large codebase takes time to compile
3. Heavy git operations

**Solutions:**

```bash
# 1. Monitor build time locally
time buffalo build -o bin/api21-test

# 2. Check network connectivity
ping github.com
curl -I https://github.com

# 3. Check disk space
df -h

# 4. Increase polling timeout if acceptable
# Edit .github/workflows/ci-cd.yml
# Increase sleep duration: sleep 5  (from sleep 2)

# 5. Optimize build process
go mod tidy
go mod download
buffalo build -o bin/api21-v1 -v

# 6. Cache dependencies in CI
# Already enabled in workflow with 'cache: true'

# 7. Parallel compilation
export GOMAXPROCS=4
buffalo build -o bin/api21-v1
```

---

### Issue: Server Doesn't Restart After Deployment

**Symptom:** Deployment completes but server still running old version

**Causes:**
1. Process not restarted
2. Load balancer still routing to old process
3. Health check failing

**Solutions:**

```bash
# 1. Check running process
ps aux | grep api21
pgrep -f api21 -l

# 2. Force restart
pkill -f "bin/api21"

# 3. Check if new version starts
make start-smart

# 4. Verify version is updated
curl http://localhost:5000/api/version

# 5. For supervised restarts, use process manager
# Example: systemd, supervisor, or pm2

# 6. If using docker, restart container
docker-compose restart api21-server

# 7. If using load balancer, update target group
# After deployment, verify health checks pass
```

---

### Issue: Disk Space Fills Up with Binaries

**Symptom:** Server runs out of disk space after multiple deployments

**Causes:**
1. Each binary is 20-50MB or larger
2. Old binaries not cleaned up
3. Multiple concurrent builds

**Solutions:**

```bash
# 1. Check disk usage
du -sh bin/
ls -lhS bin/

# 2. Calculate storage needed
# Estimate: 10 deployments × 50MB = 500MB per server

# 3. Remove old binaries (keep last 5)
ls -t bin/api21-v* | tail -n +6 | xargs rm -f

# 4. Implement automated cleanup in cron
# Add to crontab:
# 0 0 * * 0 cd /path/to/api21 && ls -t bin/api21-v* | tail -n +6 | xargs rm -f

# 5. Or add cleanup to start script
# Edit scripts/start-smart.sh to clean old versions

# 6. Monitor disk usage
watch -n 5 'df -h /var && echo "---" && du -sh bin/'
```

---

## Prevention Tips

1. **Monitor Deployments**: Check workflow status regularly
2. **Test Locally**: Run `make test` before pushing
3. **Keep Logs**: Archive workflow logs for debugging
4. **Health Checks**: Verify server status after deployment
5. **Gradual Rollouts**: Test on develop branch first
6. **Alerting**: Set up monitoring for failed deployments
7. **Backup Binary**: Keep previous working version
8. **Database Backup**: Backup redeployments table regularly

## Getting Help

If issue persists:

1. **Collect Information**:
   ```bash
   # Application version
   git log --oneline -5
   
   # Server logs
   docker-compose logs api21-server > logs.txt
   
   # Database state
   docker-compose exec db psql -U api21 -d api21_dev -c "SELECT * FROM redeployments ORDER BY version DESC LIMIT 5;" > deployments.txt
   
   # System state
   docker stats api21-server > stats.txt
   ```

2. **Check Recent Changes**:
   ```bash
   git diff HEAD~5
   git log --oneline -10
   ```

3. **Review Workflow Logs**:
   - GitHub → Actions → Latest workflow run
   - Expand redeploy step for details

4. **Create Issue with Information**:
   - Include logs from above
   - Describe reproduction steps
   - Include version numbers and timestamps
