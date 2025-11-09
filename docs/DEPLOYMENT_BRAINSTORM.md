# Deployment Strategy Brainstorm: Complete Analysis & Recommendation

## 📌 Executive Summary

**Question:** How to efficiently implement build & deploy when webhook events hit?

**Answer:** Use **Option 1+2 Hybrid (Buffalo Tasks + Goroutine)**

- ✅ Non-blocking webhook response
- ✅ Reusable task code (manual or webhook)
- ✅ Simple, no external dependencies
- ✅ Easy upgrade path to production

---

## 🎯 The Four Options Analyzed

### Option 1: Buffalo Tasks (Grifts) ⭐⭐⭐⭐
**Approach:** Use Buffalo's built-in task system in `grifts/`

```go
// Usage
gob.Task("build", "Deploy latest build", deployTask)

// Call
buffalo deploy:build  // Manual
or from webhook handler directly
```

**Best For:** Development, testing, manual triggers
**Worst For:** Production with many concurrent deploys

---

### Option 2: Simple Goroutine ⭐⭐
**Approach:** Spawn async function in webhook handler

```go
go func() {
    deployLatestBuild()
}()
```

**Best For:** Quick & dirty, MVP
**Worst For:** Production (no persistence, no visibility)

---

### Option 3: External Service (systemd) ⭐⭐⭐⭐⭐
**Approach:** Separate systemd service handles deployments

```bash
# api21-deployer.service listens on Unix socket
# Webhook sends request → Service executes deployment
```

**Best For:** Production single-server
**Worst For:** Added complexity, separate service management

---

### Option 4: Job Queue (Database + Workers) ⭐⭐⭐⭐⭐
**Approach:** Webhook queues job, background workers process it

```
Webhook → INSERT deployment_queue → Worker → Execute → Mark complete
```

**Best For:** Production scale, multi-server
**Worst For:** More complex code, need database

---

## 🏆 Decision Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│ Aspect              │ Option1 │ Option2 │ Option3 │ Option4      │
├──────────────────────────────────────────────────────────────────┤
│ Blocking Response   │ YES     │ NO      │ NO      │ NO           │
│ Setup Time          │ 1 hr    │ 30min   │ 2 hrs   │ 3 hrs        │
│ Production Ready    │ NO      │ NO      │ YES     │ YES          │
│ Crash Recovery      │ NO      │ NO      │ YES     │ YES          │
│ Concurrent Builds   │ RISKY   │ RISKY   │ YES     │ YES          │
│ Deployment History  │ NO      │ NO      │ NO      │ YES          │
│ Retry Failed Deploy │ NO      │ NO      │ NO      │ YES          │
│ External Deps       │ NONE    │ NONE    │ systemd │ Database     │
│ Cost to Add         │ LOW     │ LOW     │ HIGH    │ MEDIUM       │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ My Recommendation: Option 1+2 Hybrid

### Why This Option?

1. **Best of Both Worlds**
   - Task reusability from Option 1
   - Non-blocking async from Option 2

2. **Zero External Dependencies**
   - No extra services
   - No database needed
   - Just Buffalo + Go

3. **Simple to Start**
   - 2-3 hours to implementation
   - Easy to test and debug
   - Manual testing possible

4. **Clear Upgrade Path**
   - Easy to add file locks
   - Easy to add database logging
   - Easy to move to systemd
   - Easy to add queue system

5. **Production Sufficient for Current Scale**
   - Single server deployment
   - Good for most small-to-medium projects
   - Can upgrade when you scale

### Implementation Flow

```
GitHub Event (PR Merge / Push to main)
        ↓
    Webhook Handler
        ├─→ Verify signature ✓
        ├─→ Check branch is main/master ✓
        └─→ Spawn Goroutine (non-blocking)
                ↓
                Call Buffalo Task: grifts/deploy.go
                        ↓
                        ├─→ git pull origin main
                        ├─→ go build -o bin/api21 ./cmd/app
                        ├─→ Kill old process
                        ├─→ Start new process
                        └─→ Log result
                                ↓
                    (Back to handling requests)
    
    Return 200 OK immediately (< 100ms)
```

---

## 🛠️ Implementation Plan

### Step 1: Create Buffalo Task (grifts/deploy.go)

```go
// grifts/deploy.go
func init() {
    gob.Namespace("deploy", func() {
        gob.Task("build", "Build and deploy latest", deployTask)
    })
}

func deployTask(c *gob.Context) error {
    // 1. git pull
    // 2. go build
    // 3. kill old
    // 4. start new
}
```

### Step 2: Create Helper Functions (lib/deployer/)

```go
// lib/deployer/deployer.go
func GitPull(repoPath string) error { }
func BuildBinary(repoPath string) error { }
func GetRunningPID() (int, error) { }
func KillProcess(pid int) error { }
func StartNewBinary(binaryPath string) error { }
func LogDeployment(status string, details ...string) { }
```

### Step 3: Update Webhook Handler

```go
// actions/webhook.go - in handlePushEvent()
go func() {
    if err := deployLatestBuild(); err != nil {
        logWebhookEvent(event, "DEPLOYMENT FAILED: "+err.Error())
    }
}()

return c.Render(http.StatusOK, r.JSON("Deployment initiated"))
```

### Step 4: Test & Verify

```bash
# Test manually first
buffalo deploy:build

# Test via curl
curl -X POST http://localhost:5000/webhooks/github \
  -H "X-GitHub-Event: push" \
  -d @fixtures/webhook-push-payload.json

# Test with real GitHub (merge a PR to main)
```

---

## 📊 Phase-Based Rollout

### Phase 1: Development (Current)
- Implement Option 1 (Buffalo Task)
- Test manually with: `buffalo deploy:build`
- Iterate and refine
- **Duration:** 1-2 hours

### Phase 2: Testing (Next)
- Upgrade to Option 1+2 (Add Goroutine)
- Test with GitHub webhooks
- Verify auto-deployment works
- **Duration:** 1-2 hours

### Phase 3: Production Ready (Future)
- Add file locks (prevent concurrent builds)
- Add deployment logging to database
- Set up monitoring
- **Duration:** 2-3 hours

### Phase 4: Scale Ready (Later)
- Upgrade to Option 4 (Job Queue)
- Multiple workers
- Full history and retry logic
- **Duration:** 4-6 hours (but only if needed)

---

## 🎯 Comparison: What You Get

### With Buffalo Task Alone (Option 1)
```
✅ Reusable code (CLI or webhook)
✅ Easy to test manually
✅ Built-in logging
❌ Webhook blocks during deployment
❌ Can't handle concurrent webhooks
❌ No async processing
```

### With Goroutine Alone (Option 2)
```
✅ Fast webhook response
✅ Non-blocking
❌ No persistence
❌ No visibility
❌ Memory leak risk
❌ No reusability
```

### With Option 1+2 Hybrid ⭐ RECOMMENDED
```
✅ Reusable task code
✅ Fast webhook response
✅ Non-blocking
✅ Easy to test manually
✅ Built-in logging
✅ Simple setup
✅ No external dependencies
✅ Clear upgrade path
❌ Can't handle many concurrent deploys yet (add lock file)
❌ No persistent history yet (add database logging later)
```

---

## 🔄 Alternative Approaches (Why Not?)

### Why Not Option 3 (systemd)?
- ✅ More robust for production
- ✅ Process supervision
- ❌ Overkill for current stage
- ❌ Added complexity
- ❌ Harder to debug locally

**When to use:** When deploying to production server

### Why Not Option 4 (Queue)?
- ✅ Most scalable approach
- ✅ Full deployment history
- ✅ Retry logic
- ❌ Need database table
- ❌ More complex code
- ❌ Slower (queue latency)

**When to use:** Multi-server production or high-volume deployments

---

## 🚀 Why This Order?

### Option 1 → Option 1+2 → Option 3 → Option 4

**Progression Principle:**
- Start simple (Option 1)
- Add non-blocking (Option 1+2)
- Add robustness (Option 3)
- Add scalability (Option 4)

**Each stage adds complexity only when needed:**
- Option 1+2: No new dependencies, just goroutine
- Option 3: Need systemd and separate service
- Option 4: Need database and queue logic

---

## 💡 Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Task vs Goroutine | Both (Hybrid) | Reusability + non-blocking |
| Blocking or Async | Async | Don't slow down webhook |
| Single or Queue | Start Single | Simpler, upgrade later |
| With/Without DB | Start Without | Not needed yet |
| With/Without systemd | Start Without | Manual start for now |

---

## 📋 Next Steps (Ready to Implement?)

I'll create:

1. **grifts/deploy.go**
   - Buffalo task for deployment
   - git pull → build → kill → restart logic
   - Error handling and logging

2. **lib/deployer/deployer.go**
   - Helper functions for shell commands
   - Process management utilities
   - Logging helpers

3. **Update actions/webhook.go**
   - Spawn goroutine on push/merge
   - Call deployment task async
   - Return 200 OK immediately

4. **docs/DEPLOYMENT_GUIDE.md**
   - Complete setup instructions
   - Troubleshooting guide
   - Upgrade path to production
   - Monitoring and alerts

5. **docs/DEPLOYMENT_SECURITY.md**
   - Security best practices
   - Permission model
   - Rollback procedures

---

## 🎓 Learning Resources Included

I've already created:
1. ✅ `docs/DEPLOYMENT_STRATEGY.md` - Full analysis (this document's data)
2. ✅ `docs/DEPLOYMENT_OPTIONS.md` - Visual comparison

Ready to proceed with implementation? 🚀

