# GitHub Webhook Integration Documentation

## Table of Contents

1. [Quick Start](#quick-start)
2. [Overview](#overview)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Event Types](#event-types)
5. [Setup & Configuration](#setup--configuration)
6. [Webhook Payload Structure](#webhook-payload-structure)
7. [Request Processing](#request-processing)
8. [Security](#security)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Real-World Examples](#real-world-examples)
12. [Advanced Topics](#advanced-topics)

---

## Quick Start

Get your GitHub webhook integration running in 5 minutes!

### 🚀 Quick Setup (5 minutes)

#### 1. Generate a Webhook Secret

```bash
# Generate a strong random secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "Your webhook secret: $WEBHOOK_SECRET"
```

#### 2. Configure API21

Add to your `.env` file:

```bash
# .env
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
```

Or set as environment variable:
```bash
export GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
```

#### 3. Start API21

```bash
# Development
buffalo dev

# Production
GO_ENV=production ./bin/api21
```

#### 4. Configure GitHub Repository

1. Go to your GitHub repository
2. **Settings** → **Webhooks** → **Add webhook**
3. **Payload URL:** `https://your-api.example.com/webhooks/github`
4. **Content type:** `application/json`
5. **Secret:** Paste your webhook secret from step 1
6. **Select events:** 
   - ✅ Pull requests
   - ✅ Pushes
7. **Active:** ✅ Checked
8. Click **Add webhook**

#### 5. Test It

```bash
# Merge a PR on GitHub, then check your logs
buffalo dev

# Should see output like:
# [WEBHOOK] PR merged #42 'Add feature' on main (action: closed, ...)
```

### 🧪 Test Without GitHub

Test locally using the provided fixtures:

```bash
# Test PR merge event
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: pull_request" \
  -H "Content-Type: application/json" \
  -d @fixtures/webhook-pr-merged-payload.json

# Test push event
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: push" \
  -H "Content-Type: application/json" \
  -d @fixtures/webhook-push-payload.json
```

### 📋 What Happens When

#### When a PR is Merged
- ✅ Webhook triggered automatically
- ✅ API21 verifies GitHub's signature
- ✅ Event is logged with PR details
- ✅ Response includes PR number, title, merger info

#### When Code is Pushed to Main
- ✅ Webhook triggered automatically
- ✅ API21 verifies GitHub's signature
- ✅ Event is logged with commit details
- ✅ Response includes commit SHA and author

#### When Events Are Ignored
- ❌ PR targets non-main branch → Ignored
- ❌ Push to non-main branch → Ignored
- ❌ Invalid webhook secret → Returns 401

### 📊 Quick Response Examples

**Successful PR Merge:**
```json
{
  "status": "received",
  "event_type": "pull_request",
  "action": "merged",
  "pr_number": 42,
  "pr_title": "Add webhook integration",
  "branch": "main",
  "repository": "Abhay2133/api21",
  "merged_by": "john-doe"
}
```

**Successful Push:**
```json
{
  "status": "received",
  "event_type": "push",
  "action": "pushed",
  "branch": "main",
  "repository": "Abhay2133/api21",
  "commit_sha": "abc123def456",
  "author": "jane-smith"
}
```

**Missing Secret (401):**
```json
{
  "error": "Invalid webhook signature"
}
```

---

## Overview

The API21 webhook system receives and processes GitHub events in real-time. It handles **pull request** and **push** events specifically for the `main` and `master` branches, enabling automated CI/CD pipelines, deployment triggers, notifications, and other integrations.

### Key Features

- ✅ **HMAC-SHA256 Signature Verification** - Ensures requests are from GitHub
- ✅ **Event Filtering** - Only processes main/master branch events
- ✅ **PR Merge Detection** - Identifies when PRs are merged
- ✅ **Commit Tracking** - Captures commit details for push events
- ✅ **Structured Logging** - Logs all events for audit trails
- ✅ **Error Handling** - Returns appropriate HTTP status codes
- ✅ **Production Ready** - Constant-time comparison for security

### Supported Events

- `pull_request` - When PRs are opened, closed, merged, etc.
- `push` - When commits are pushed to branches

---

## Architecture & Data Flow

### System Flow Diagram

```
GitHub Repository
       |
       | Webhook Event Triggered
       | (PR merged or Push to main)
       v
┌─────────────────────────────────────────┐
│     HTTPS POST Request to API21         │
│  POST /webhooks/github                  │
│  Headers:                               │
│  - X-GitHub-Event: pull_request|push    │
│  - X-Hub-Signature-256: sha256=...      │
│  - Content-Type: application/json       │
│  Body: GitHub Webhook Payload (JSON)    │
└─────────────────────────────────────────┘
       |
       v
┌─────────────────────────────────────────┐
│    WebhookHandler (Entry Point)         │
│  1. Extract X-GitHub-Event header       │
│  2. Read request body                   │
│  3. Verify HMAC-SHA256 signature        │
│  4. Parse JSON payload                  │
│  5. Route to event-specific handler     │
└─────────────────────────────────────────┘
       |
       +─────────────────────────────┬───────────────────────┐
       |                             |                       |
       v (pull_request)              v (push)                v (other)
┌──────────────────────┐    ┌──────────────────────┐    ┌────────────┐
│ handlePREvent()      │    │ handlePushEvent()    │    │ Log & Skip │
│                      │    │                      │    └────────────┘
│ 1. Extract PR data   │    │ 1. Extract branch    │
│ 2. Check base branch │    │ 2. Check branch      │
│ 3. Detect merge      │    │ 3. Skip create/del   │
│ 4. Log event         │    │ 4. Get commit info   │
│ 5. Return 200 OK     │    │ 5. Log event         │
└──────────────────────┘    │ 6. Return 200 OK     │
                            └──────────────────────┘
       |                             |
       └─────────────┬───────────────┘
                     |
                     v
            ┌──────────────────────┐
            │  logWebhookEvent()   │
            │  (Audit Trail)       │
            │  - Print summary     │
            │  - Could save to DB  │
            └──────────────────────┘
                     |
                     v
            ┌──────────────────────┐
            │  Return JSON Response│
            │  (200 OK / 400 / 401)│
            └──────────────────────┘
                     |
                     v
            GitHub Receives Response
            Webhook Delivery Complete
```

### Data Flow - Detailed

#### 1. **Request Reception**
- GitHub sends HTTPS POST to `POST /webhooks/github`
- Request contains headers for authentication and event identification
- Request body contains the full webhook payload as JSON

#### 2. **Security Verification**
- Extract `X-GitHub-Event` header (required - identifies event type)
- Extract `X-Hub-Signature-256` header (for HMAC verification)
- Read request body into memory
- Verify signature using HMAC-SHA256 constant-time comparison
- If signature invalid → Return 401 Unauthorized

#### 3. **Payload Parsing**
- Unmarshal JSON payload into `GitHubWebhookPayload` struct
- If parsing fails → Return 400 Bad Request

#### 4. **Event Routing**
- Switch on event type (`X-GitHub-Event` header value)
- Route to appropriate handler:
  - `pull_request` → `handlePullRequestEvent()`
  - `push` → `handlePushEvent()`
  - Other → Log and skip

#### 5. **Event-Specific Processing**

**For Pull Request Events:**
- Extract PR details (number, title, state, merged status)
- Check if base branch is `main` or `master`
- If not main/master → Return 200 OK with "ignored" message
- If merged → Create event with "merged" action, log it
- If not merged → Create event with action (opened/closed/reopened), log it

**For Push Events:**
- Extract branch from ref (`refs/heads/main` → `main`)
- Check if branch is `main` or `master`
- If not main/master → Return 200 OK with "ignored" message
- If branch creation/deletion flag set → Handle separately
- Extract commit details (SHA, message, author)
- Create event and log it

#### 6. **Logging & Audit Trail**
- Format event summary with key details
- Print summary to stdout (can be integrated with logging service)
- Could be extended to save to database

#### 7. **Response**
- Return 200 OK with JSON response containing event details
- Response confirms webhook was received and processed

---

## Event Types

### 1. Pull Request Event

**Event Header:** `X-GitHub-Event: pull_request`

**Triggered When:**
- PR is opened, closed, reopened, synchronized, or merged
- Any action on the PR

**Processing Rules:**
- Only processes PRs targeting `main` or `master` branch
- Detects merged PRs (checks `merged: true` and `state: closed`)
- Captures PR number, title, author, merger

**Response Example (Merged PR):**
```json
{
  "status": "received",
  "event_type": "pull_request",
  "action": "merged",
  "pr_number": 42,
  "pr_title": "Add webhook integration",
  "branch": "main",
  "repository": "Abhay2133/api21",
  "merged_by": "john-doe"
}
```

**Response Example (Ignored PR - non-main):**
```json
{
  "message": "PR #43 on branch 'develop' ignored (not main/master)"
}
```

---

### 2. Push Event

**Event Header:** `X-GitHub-Event: push`

**Triggered When:**
- Commits are pushed to a branch
- Branch is created or deleted

**Processing Rules:**
- Only processes pushes to `main` or `master` branch
- Skips branch creation/deletion events (reports them separately)
- Captures commit SHA, message, author

**Response Example (Normal Push):**
```json
{
  "status": "received",
  "event_type": "push",
  "action": "pushed",
  "branch": "main",
  "repository": "Abhay2133/api21",
  "commit_sha": "abc123def456",
  "author": "jane-smith"
}
```

**Response Example (Branch Creation):**
```json
{
  "status": "received",
  "event_type": "push",
  "action": "created",
  "branch": "main",
  "repository": "Abhay2133/api21"
}
```

---

## Setup & Configuration

### Step 1: Enable Webhooks on GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Set **Payload URL** to: `https://your-api.example.com/webhooks/github`
4. Set **Content type** to: `application/json`
5. Set **Secret** to a strong random string (e.g., `openssl rand -hex 32`)
6. Select events:
   - ✅ **Pull requests**
   - ✅ **Pushes**
7. Set as **Active** (checkbox checked)
8. Click **Add webhook**

### Step 2: Configure API21 Webhook Secret

Store the GitHub webhook secret in your environment:

```bash
# .env file (development)
GITHUB_WEBHOOK_SECRET=your-webhook-secret-from-github

# Production (set environment variable)
export GITHUB_WEBHOOK_SECRET=your-webhook-secret-from-github
```

### Step 3: Start the Application

```bash
# Development
buffalo dev

# Production
GO_ENV=production ./bin/api21
```

### Step 4: Verify Setup

GitHub will send a test ping event when you create the webhook. Check:

1. **Application logs** - Should see webhook activity
2. **GitHub webhook settings** - Recent deliveries section shows delivery status
3. **Test delivery** - Use GitHub's "Recent Deliveries" interface to see requests/responses

---

## Webhook Payload Structure

### Base Payload Structure

All GitHub webhooks follow this structure:

```go
type GitHubWebhookPayload struct {
    Action       string             // "opened", "closed", "merged", etc.
    PullRequest  *GitHubPullRequest // Only for PR events
    Push         *GitHubPush        // Only for push events
    Ref          string             // Branch ref (e.g., "refs/heads/main")
    Repository   GitHubRepository   // Repository information
    HeadCommit   *GitHubCommit      // Latest commit (push events)
    Installation GitHubInstallation // GitHub App installation
    EventType    string             // Set from X-GitHub-Event header
}
```

### Pull Request Payload

```json
{
  "action": "closed",
  "pull_request": {
    "id": 1234567,
    "number": 42,
    "title": "Add webhook integration",
    "body": "Implements GitHub webhook support",
    "state": "closed",
    "merged": true,
    "merged_at": "2025-11-08T10:30:00Z",
    "base": {
      "ref": "main",
      "sha": "abc123abc123abc123abc123abc123abc123abc1",
      "repo": {
        "id": 123456,
        "name": "api21",
        "full_name": "Abhay2133/api21"
      }
    },
    "head": {
      "ref": "feature/webhooks",
      "sha": "def456def456def456def456def456def456def4",
      "repo": {
        "id": 123456,
        "name": "api21",
        "full_name": "Abhay2133/api21"
      }
    },
    "merged_by": {
      "login": "john-doe",
      "id": 987654,
      "avatar_url": "https://avatars.githubusercontent.com/u/987654?v=4",
      "html_url": "https://github.com/john-doe",
      "type": "User"
    },
    "created_at": "2025-11-08T09:00:00Z",
    "updated_at": "2025-11-08T10:30:00Z"
  },
  "repository": {
    "id": 123456,
    "name": "api21",
    "full_name": "Abhay2133/api21",
    "owner": {
      "login": "Abhay2133",
      "id": 111111,
      "avatar_url": "https://avatars.githubusercontent.com/u/111111?v=4",
      "html_url": "https://github.com/Abhay2133",
      "type": "Organization"
    },
    "private": false,
    "html_url": "https://github.com/Abhay2133/api21",
    "clone_url": "https://github.com/Abhay2133/api21.git"
  },
  "installation": {
    "id": 54321
  }
}
```

### Push Payload

```json
{
  "ref": "refs/heads/main",
  "before": "abc123abc123abc123abc123abc123abc123abc1",
  "after": "def456def456def456def456def456def456def4",
  "repository": {
    "id": 123456,
    "name": "api21",
    "full_name": "Abhay2133/api21",
    "private": false,
    "html_url": "https://github.com/Abhay2133/api21",
    "clone_url": "https://github.com/Abhay2133/api21.git"
  },
  "pusher": {
    "name": "jane-smith",
    "email": "jane@example.com"
  },
  "head_commit": {
    "id": "def456def456def456def456def456def456def4",
    "tree_id": "tree123tree123tree123tree123tree123tree1",
    "message": "Fix webhook signature verification",
    "timestamp": "2025-11-08T10:15:00Z",
    "author": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "username": "jane-smith"
    },
    "committer": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "username": "jane-smith"
    },
    "added": ["actions/webhook.go"],
    "removed": [],
    "modified": []
  },
  "installation": {
    "id": 54321
  }
}
```

---

## Request Processing

### Request Lifecycle

```
┌─────────────────────────────────────────┐
│ 1. Receive HTTP Request                 │
│    POST /webhooks/github                │
│    Content-Type: application/json       │
└────────────────────┬────────────────────┘
                     │
                     v
┌─────────────────────────────────────────┐
│ 2. Extract Headers                      │
│    X-GitHub-Event: pull_request|push    │
│    X-Hub-Signature-256: sha256=...      │
│    (return 400 if event header missing) │
└────────────────────┬────────────────────┘
                     │
                     v
┌─────────────────────────────────────────┐
│ 3. Read & Verify Body                   │
│    Read request body                    │
│    Check not empty                      │
│    (return 400 if invalid)              │
└────────────────────┬────────────────────┘
                     │
                     v
┌─────────────────────────────────────────┐
│ 4. Verify Signature (if secret set)     │
│    Extract signature from header        │
│    Compute HMAC-SHA256 of body          │
│    Constant-time comparison             │
│    (return 401 if invalid)              │
└────────────────────┬────────────────────┘
                     │
                     v
┌─────────────────────────────────────────┐
│ 5. Parse JSON Payload                   │
│    Unmarshal JSON into Go struct        │
│    Validate structure                   │
│    (return 400 if invalid JSON)         │
└────────────────────┬────────────────────┘
                     │
                     v
┌─────────────────────────────────────────┐
│ 6. Route to Handler                     │
│    Switch on event type                 │
│    Call appropriate handler             │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         v           v           v
    [PR Handler] [Push]      [Skip]
    [Filtering]   [Handler]   [200 OK]
    [Processing] [Filtering]
         │         [Processing]
         │           │
         └───────────┴───────────┤
                     │
                     v
         ┌──────────────────────┐
         │ 7. Log Event         │
         │    Print Summary     │
         │    Could Save to DB  │
         └──────────┬───────────┘
                     │
                     v
         ┌──────────────────────┐
         │ 8. Return Response   │
         │    200 OK JSON       │
         │    400 Bad Request   │
         │    401 Unauthorized  │
         └──────────────────────┘
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200 OK` | Webhook received and processed | Always on success |
| `400 Bad Request` | Invalid request format | Missing headers, empty body, invalid JSON |
| `401 Unauthorized` | Signature verification failed | Invalid HMAC-SHA256 signature |

### Error Responses

**Missing Event Header:**
```json
{
  "error": "Missing X-GitHub-Event header"
}
```

**Invalid JSON:**
```json
{
  "error": "Invalid payload format"
}
```

**Invalid Signature:**
```json
{
  "error": "Invalid webhook signature"
}
```

---

## Security

### HMAC-SHA256 Signature Verification

All GitHub webhooks include a signature to prevent spoofing. The signature is calculated using:

```
signature = "sha256=" + HMAC-SHA256(webhook_secret, request_body)
```

### Implementation Details

```go
func verifyWebhookSignature(body []byte, signature, secret string) bool {
    // Create HMAC signature
    h := hmac.New(sha256.New, []byte(secret))
    h.Write(body)
    expectedSignature := "sha256=" + hex.EncodeToString(h.Sum(nil))
    
    // Constant-time comparison (prevents timing attacks)
    return hmac.Equal([]byte(signature), []byte(expectedSignature))
}
```

### Security Best Practices

1. **Use Strong Secrets**
   ```bash
   # Generate a 32-byte (256-bit) random secret
   openssl rand -hex 32
   ```

2. **Store Securely**
   - Never commit secrets to git
   - Use environment variables
   - Use secret management systems (Vault, AWS Secrets Manager, etc.)

3. **HTTPS Only**
   - Always use HTTPS for webhook URLs
   - Never use HTTP in production

4. **Rotate Secrets**
   - Periodically change webhook secrets
   - GitHub allows multiple secrets

5. **Validate Input**
   - Never trust webhook data directly
   - Validate all fields before processing
   - Sanitize before storing in database

6. **Rate Limiting**
   - Consider adding rate limiting if needed
   - GitHub sends webhooks sequentially for a repository

---

## Testing

### Manual Testing with cURL

#### 1. Test PR Merge Event

```bash
# Using provided fixture
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: pull_request" \
  -H "Content-Type: application/json" \
  -d @fixtures/webhook-pr-merged-payload.json

# Expected Response:
# {
#   "status": "received",
#   "event_type": "pull_request",
#   "action": "merged",
#   "pr_number": 42,
#   "pr_title": "...",
#   "branch": "main",
#   "repository": "...",
#   "merged_by": "..."
# }
```

#### 2. Test Push Event

```bash
# Using provided fixture
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: push" \
  -H "Content-Type: application/json" \
  -d @fixtures/webhook-push-payload.json

# Expected Response:
# {
#   "status": "received",
#   "event_type": "push",
#   "action": "pushed",
#   "branch": "main",
#   "repository": "...",
#   "commit_sha": "...",
#   "author": "..."
# }
```

#### 3. Test Missing Header

```bash
curl -X POST http://localhost:5000/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"action":"opened"}'

# Expected Response (400):
# {
#   "error": "Missing X-GitHub-Event header"
# }
```

#### 4. Test Invalid Signature

```bash
# Set webhook secret in .env
GITHUB_WEBHOOK_SECRET=test-secret

# Create invalid signature (wrong secret)
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -H "Content-Type: application/json" \
  -d '{"action":"opened"}'

# Expected Response (401):
# {
#   "error": "Invalid webhook signature"
# }
```

### Unit Tests

Run the webhook tests:

```bash
# Run all tests
buffalo test ./actions

# Run specific test
buffalo test -run TestExtractBranchFromRef ./actions

# Run with coverage
buffalo test -cover ./actions
```

### GitHub's Testing Tools

1. **Recent Deliveries**
   - GitHub Settings → Webhooks → Your webhook
   - View delivery status, request/response bodies
   - Redeliver failed webhooks

2. **Request/Response Inspector**
   - See exact payload sent
   - See response received
   - Debug signature issues

---

## Troubleshooting

### Webhook Not Triggering

**Problem:** Webhook events not being received

**Solutions:**
1. Verify webhook is enabled in GitHub settings (checkbox)
2. Check "Active" is selected
3. Verify events are selected (Pull requests, Pushes)
4. Check GitHub's "Recent Deliveries" for delivery status
5. Ensure API21 is accessible at the configured URL
6. Check firewall/network rules allow outbound HTTPS from GitHub

### Signature Verification Failed

**Problem:** `"error": "Invalid webhook signature"`

**Solutions:**
1. Verify `GITHUB_WEBHOOK_SECRET` matches GitHub's setting exactly
2. Check for extra whitespace in secret
3. Ensure secret is set as environment variable before starting app
4. Use GitHub's webhook testing interface to see actual signature sent

### PR Events Not Processing

**Problem:** PR webhooks received but not processed

**Solutions:**
1. Check PR target branch is `main` or `master`
2. Check application logs for filtered message
3. Use cURL with fixture to test locally
4. Verify PR data structure in GitHub's recent deliveries

### Empty Request Body

**Problem:** `"error": "Empty request body"`

**Solutions:**
1. Ensure Content-Type is `application/json`
2. Check request body is being sent
3. Verify not using GET instead of POST

| Problem | Solution |
|---------|----------|
| Webhook not triggering | Check webhook is enabled in Settings → Webhooks |
| Got 401 error | Verify `GITHUB_WEBHOOK_SECRET` matches exactly |
| Got 400 error | Check Content-Type header is `application/json` |
| PR events ignored | Verify PR targets `main` or `master` branch |
| Signature mismatch | Copy exact secret from GitHub (no extra spaces) |

---

## Real-World Examples

### Example 1: Trigger Deployment on PR Merge

```go
// In handlePullRequestEvent()
if event.Action == "merged" {
    // Trigger deployment pipeline
    triggerDeployment(event.Branch, event.Repository)
}
```

### Example 2: Send Slack Notification

```go
// In logWebhookEvent()
if event.EventType == "pull_request" && event.Action == "merged" {
    sendSlackNotification(fmt.Sprintf(
        "PR #%d merged to %s by %s",
        event.PRNumber,
        event.Branch,
        event.MergedBy,
    ))
}
```

### Example 3: Store Events in Database

```go
// Create a webhooks table
// Then in logWebhookEvent():
tx := getCurrentTransaction()
webhookLog := &WebhookLog{
    EventType:  event.EventType,
    Action:     event.Action,
    Repository: event.Repository,
    Branch:     event.Branch,
    Details:    marshallEventToJSON(event),
    CreatedAt:  time.Now(),
}
tx.Create(webhookLog)
```

### Example 4: Filter Specific Repositories

```go
// In WebhookHandler()
if payload.Repository.FullName != "Abhay2133/api21" {
    return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
        "message": "Repository ignored",
    }))
}
```

### Example 5: Validate Commit Message Format

```go
// In handlePushEvent()
if event.EventType == "push" {
    if !isValidCommitMessage(event.CommitMsg) {
        return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
            "error": "Commit message does not meet standards",
        }))
    }
}
```

---

## Advanced Topics

### Storing Webhook Events in Database

To persist webhook events for audit trails:

1. Create a `webhook_events` table migration:
```fizz
create_table("webhook_events") {
    t.Column("id", "uuid", {primary: true})
    t.Column("event_type", "string", {})
    t.Column("action", "string", {})
    t.Column("repository", "string", {})
    t.Column("branch", "string", {})
    t.Column("pr_number", "integer", {nullable: true})
    t.Column("commit_sha", "string", {nullable: true})
    t.Column("payload", "jsonb", {})
    t.Timestamps()
}
```

2. Create `WebhookEvent` model with GORM

3. Save events in handler:
```go
webhookEvent := &models.WebhookEvent{
    EventType:  payload.EventType,
    Action:     event.Action,
    // ... other fields
}
tx.ValidateAndCreate(webhookEvent)
```

### Webhook Rate Limiting

Add rate limiting to prevent abuse:

```go
import "github.com/throttled/throttled/v2"

// In app.go
quotaKeeper := simplememory.NewQuotaKeeper(100, time.Minute)
rateLimiter := throttled.RateLimit(
    throttled.PerSec(10),
    &quotaKeeper,
)
webhookGroup.Use(rateLimiter)
```

### Async Processing

For long-running operations, process webhooks asynchronously:

```go
// Use job queue (e.g., Buffalo Jobs)
go func() {
    deployment := NewDeployment(event)
    deployment.Execute()
}()

return c.Render(http.StatusOK, r.JSON("Processing..."))
```

---

## Resources

### Official Documentation
- [Buffalo Docs](https://gobuffalo.io/en/docs/overview)
- [Setting up Webhooks on GitHub](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks)
- [GitHub Webhook Events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)
- [HMAC-SHA256 in Go](https://golang.org/pkg/crypto/hmac/)

### Related Documentation
- [Main README](/README.md) - Project overview
- [API Examples](/README.md#-api-examples) - Other API endpoints

---

**Last Updated:** November 9, 2025  
**Status:** ✅ Complete and Ready for Production
