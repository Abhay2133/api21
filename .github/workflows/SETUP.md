# GitHub Actions Setup Guide for Redeploy Feature

## Quick Setup (5 minutes)

### Step 1: Add Repository Secret

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `REDEPLOY_URL`
4. Value: `https://your-api-server.com` (or `http://localhost:5000` for testing)
5. Click "Add secret"

### Step 2: Verify Workflow File

The workflow file `.github/workflows/ci-cd.yml` is already created and will:
- Run tests on every push and PR to main/develop
- Trigger redeploy automatically after successful tests
- Poll for deployment status for up to 4 minutes
- Show progress in workflow logs

### Step 3: Push to Trigger

Push code to main or develop branch:
```bash
git add .
git commit -m "Add redeploy feature"
git push origin main
```

The workflow will automatically:
1. Run tests
2. Trigger `/api/redeploy` endpoint
3. Poll `/api/redeploy/:version` for status
4. Show results in GitHub Actions

## Workflow Structure

### Trigger Events

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

- ✅ Runs tests on all PRs to main/develop
- ✅ Runs tests on all pushes to main/develop
- ⚠️ Redeploy only runs on pushes (not PRs)

### Jobs

#### Test Job
```
- Runs on: ubuntu-latest
- Database: PostgreSQL 15
- Setup: Go 1.24.5, Buffalo CLI
- Steps: dependencies, migrations, tests, coverage
```

#### Redeploy Job
```
- Depends on: test job (must pass)
- Runs on: Ubuntu latest
- Triggers: /api/redeploy endpoint
- Polls: /api/redeploy/:version every 2 seconds
- Timeout: 4 minutes (120 attempts)
- Retries: 3 attempts if initial trigger fails
```

## GitHub Actions Usage

### View Workflow Status

1. Go to your repository
2. Click "Actions" tab
3. Select "CI/CD Tests and Redeploy"
4. Click on the latest run
5. Expand steps to see details

### View Deployment Logs

In the workflow run, expand the "Trigger redeploy endpoint" or "Poll deployment status" steps to see:
- HTTP responses from `/api/redeploy` endpoint
- Current deployment status
- Polling attempts and timing
- Success or failure messages

### Example Output

```
Attempt 1 of 3...
Redeploy initiated successfully!
Response: {"id":"...","version":1,"status":"pending","message":"..."}
Deployment version: 1

Polling status (attempt 1/120)...
Status: in_progress

Polling status (attempt 2/120)...
Status: in_progress

Polling status (attempt 3/120)...
Status: completed
✓ Deployment completed successfully!
```

## Environment Variables

The workflow uses the secret automatically:

```yaml
# Set in workflow steps:
REDEPLOY_URL=${{ secrets.REDEPLOY_URL }}
```

This is NOT set as a GitHub variable, but read from the repository secret during workflow execution.

## Customization

### Change Polling Timeout

Edit `.github/workflows/ci-cd.yml`:

```yaml
# Default: 120 attempts × 2 seconds = 4 minutes
# Change MAX_POLLS to increase timeout

for ((poll=1; poll<=120; poll++)); do  # <- Change 120 here
  # ...
  sleep 2  # <- Or change 2 to 5 for longer delays
done
```

### Change Retry Attempts

```yaml
# Default: 3 attempts to trigger redeploy
MAX_RETRIES=3  # <- Change this value
```

### Add Slack Notifications

```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -d '{"text":"Deployment failed: {{ job.status }}"}'
```

### Add Email Notifications

Use GitHub's native notifications or a custom action.

## Local Testing

### Test the Workflow Locally

Using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act/releases

# Run the workflow
act -s REDEPLOY_URL=http://localhost:5000

# Simulate push event
act push -s REDEPLOY_URL=http://localhost:5000
```

### Test the Endpoints

```bash
# Start dev server
buffalo dev

# In another terminal, test trigger
curl -X POST http://localhost:5000/api/redeploy

# Test status polling
VERSION=1
for i in {1..5}; do
  echo "Attempt $i:"
  curl -s http://localhost:5000/api/redeploy/$VERSION | jq '.status'
  sleep 2
done
```

## Troubleshooting

### Secret Not Found Error

**Error:** `REDEPLOY_URL: not set`

**Solution:**
1. Go to Settings → Secrets and variables → Actions
2. Verify secret name is exactly `REDEPLOY_URL`
3. Verify value is correct (https://... or http://...)
4. Wait 1 minute after creating secret for it to be available

### Workflow Timeout

**Error:** Polling timeout after 4 minutes

**Solution:**
1. Check if redeploy server is running
2. Check server logs for errors
3. Increase MAX_POLLS in workflow file
4. Check network connectivity between GitHub and server

### Connection Refused

**Error:** `curl: (7) Failed to connect`

**Solution:**
1. Verify REDEPLOY_URL is accessible
2. Check if server is running
3. Check firewall/security group rules
4. For production: verify HTTPS certificate
5. For testing: use http://localhost:5000 (only with act)

### Redeploy Endpoint 500

**Error:** HTTP 500 from /api/redeploy

**Solution:**
1. Check server logs: `docker logs api21-server`
2. Verify database is running
3. Verify migrations were run
4. Check database connection string

### Tests Pass but Redeploy Doesn't Run

**Cause:** Redeploy only triggers on push to main/develop, not PRs

**Note:** This is by design. To test on PR, modify workflow condition:

```yaml
redeploy:
  if: always()  # Run on PRs too
```

## Monitoring & Debugging

### Check Workflow Runs

```bash
# Using GitHub CLI
gh run list --workflow=ci-cd.yml

# View specific run
gh run view <run-id>

# View step logs
gh run view <run-id> --log
```

### Check Server Logs

```bash
# Docker
docker logs api21-server -f

# Manual
tail -f /var/log/api21.log
```

### Check Database

```bash
# Connect to database
psql postgres://api21:api21_password@localhost:5432/api21_dev

# View recent deployments
SELECT * FROM redeployments ORDER BY version DESC LIMIT 5;
```

## Advanced Configuration

### Only Deploy on Tag

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Only Deploy to Production on Tag

```yaml
redeploy:
  if: startsWith(github.ref, 'refs/tags/v')
```

### Deploy Multiple Servers

```yaml
strategy:
  matrix:
    server:
      - staging
      - production
steps:
  - run: |
      REDEPLOY_URL=${{ secrets[format('{0}_REDEPLOY_URL', matrix.server)] }}
      # Trigger redeploy...
```

### Skip Deployment on Label

```yaml
redeploy:
  if: |
    !contains(github.event.head_commit.message, '[skip-deploy]')
```

## Security Considerations

1. **Secret Management**: REDEPLOY_URL is stored securely
2. **Network**: For production, use HTTPS only
3. **Access Control**: Add IP whitelisting if needed
4. **Logging**: Workflow logs are public by default
5. **Credentials**: Never commit secrets; use GitHub secrets

## CI/CD Best Practices

1. **Always run tests first** - Redeploy only after passing tests
2. **Use status checks** - Require successful tests before merge
3. **Monitor deployments** - Check workflow logs after push
4. **Tag releases** - Use git tags for production deployments
5. **Rollback plan** - Keep previous binary versions
6. **Notify team** - Add Slack/email notifications

## Reference

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI](https://cli.github.com/)
- [act - Local GitHub Actions](https://github.com/nektos/act)
- [Redeploy Documentation](../redeploy/README.md)
