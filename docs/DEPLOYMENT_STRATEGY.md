# Webhook-Triggered Deployment Strategy: Brainstorm & Analysis

## 🎯 Problem Statement

When a PR is merged or code is pushed to `main` branch, we need to:
1. Pull latest changes from GitHub
2. Build the application
3. Kill the current running server
4. Start the newly built binary

**Key Question:** What's the most efficient way? Tasks? Separate Process? Hybrid?

---

## 📊 Approach Comparison

### Option 1: Buffalo Tasks (Grifts)

**What:** Use Buffalo's built-in task system (located in `grifts/`)

#### Pros ✅
- **Native to Buffalo** - Designed for this use case
- **Simple Integration** - Easy to call from webhook handler
- **Development-Friendly** - Can run manually during testing
- **Context Access** - Full access to Buffalo app context
- **Logging** - Integrated with Buffalo logging
- **Testing** - Easy to write tests for tasks
- **Code Reusability** - Tasks can be called from CLI or programmatically
- **Minimal Setup** - No external dependencies needed

#### Cons ❌
- **Blocking I/O** - Tasks run in main thread, could slow webhook response
- **Timeout Risk** - If build takes too long, HTTP request times out
- **Limited Supervision** - No easy process monitoring/restart if it fails
- **No Async** - Can't easily detach from HTTP request
- **Single Instance** - Harder to manage multiple builds running simultaneously

#### Implementation
```bash
# In grifts/deploy.go
func init() {
    gob.Namespace("deploy", func() {
        gob.Task("build", "Build and deploy application", buildAndDeploy)
    })
}

func buildAndDeploy(c *gob.Context) error {
    // 1. git pull
    // 2. go build
    // 3. kill old process
    // 4. start new binary
    return nil
}

# In webhook handler
package actions

func handlePushEvent(c buffalo.Context, payload GitHubWebhookPayload) {
    // ... validation ...
    
    // Trigger deployment
    go func() {
        runner.Run(runner.Cmd{
            Name: "deploy:build",
        })
    }()
    
    return c.Render(200, r.JSON("Deployment started"))
}
```

**Rating:** ⭐⭐⭐⭐ (Good, but blocking issues)

---

### Option 2: Separate Go Goroutine

**What:** Spawn a goroutine in the webhook handler to handle deployment

#### Pros ✅
- **Non-Blocking** - Returns response immediately
- **Async Processing** - Handler doesn't wait for deployment
- **Simple** - Minimal setup, no external dependencies
- **Fast Response** - HTTP response sent before long operation starts
- **Lightweight** - No process overhead

#### Cons ❌
- **No Persistence** - If app crashes, deployment in progress is lost
- **Memory Issues** - Long-running goroutines can leak memory if not managed
- **No Queue** - Multiple webhooks could trigger multiple concurrent builds
- **Resource Contention** - No control over resource usage
- **Difficult Logging** - Hard to centralize logs from background goroutines
- **No Visibility** - Can't easily check deployment status
- **Race Conditions** - Multiple builds could interfere with each other

#### Implementation
```go
// In webhook.go
func handlePushEvent(c buffalo.Context, payload GitHubWebhookPayload) {
    // ... validation ...
    
    // Trigger async deployment
    go func() {
        deployLatestBuild()
    }()
    
    return c.Render(http.StatusOK, r.JSON("Deployment initiated"))
}

func deployLatestBuild() {
    // 1. git pull
    // 2. go build
    // 3. kill old
    // 4. start new
}
```

**Rating:** ⭐⭐ (Simple but problematic at scale)

---

### Option 3: External Deployment Service (systemd/supervisor)

**What:** Create a separate service that monitors for deployment requests (files, API, socket)

#### Pros ✅
- **Process Supervision** - Service manager (systemd/supervisor) restarts if crashed
- **Clean Separation** - Deployment logic isolated from API
- **Scalability** - Can run on different machine
- **Reliability** - Persistent queue if database-backed
- **Monitoring** - systemd/supervisor provides logs and status
- **Resource Control** - Limits on memory, CPU, etc.
- **Multi-Instance** - Easy to scale deployment service
- **No Memory Leaks** - Separate process lifecycle

#### Cons ❌
- **Complex Setup** - Requires external configuration
- **IPC Overhead** - Network/socket communication adds latency
- **Deployment Complexity** - More infrastructure to manage
- **Debugging** - Harder to trace issues across processes
- **Platform Dependent** - Different setup on Linux/macOS/Windows

#### Implementation
```bash
# Create deployment service that listens on Unix socket or port
# Webhook handler sends request to service
# Service handles: git pull → build → restart

# systemd service file: /etc/systemd/system/api21-deployer.service
[Unit]
Description=API21 Deployment Service
After=network.target api21.service

[Service]
Type=simple
ExecStart=/path/to/api21-deployer
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Rating:** ⭐⭐⭐⭐⭐ (Most robust, but complex)

---

### Option 4: Hybrid - Goroutine + Job Queue (Redis/Database)

**What:** Use goroutine to queue the job, then let a background worker process it

#### Pros ✅
- **Non-Blocking** - Fast webhook response
- **Persistent Queue** - If app crashes, jobs aren't lost
- **Multiple Workers** - Can have multiple goroutines processing queue
- **Retry Logic** - Failed deployments can be retried
- **Monitoring** - Can track deployment status
- **Rate Limiting** - Control concurrent deployments
- **History** - Audit trail of deployments
- **Scalable** - Queue can be moved to external service

#### Cons ❌
- **Extra Dependency** - Need Redis or database
- **Added Complexity** - Queue management code needed
- **Setup Time** - More initial configuration
- **Operational Overhead** - Monitor the queue system

#### Implementation
```go
// In webhook.go
func handlePushEvent(c buffalo.Context, payload GitHubWebhookPayload) {
    // Queue the deployment job
    job := &DeploymentJob{
        Repository: payload.Repository.FullName,
        Branch:     extractBranchFromRef(payload.Ref),
        CommitSHA:  payload.HeadCommit.ID,
        CreatedAt:  time.Now(),
        Status:     "pending",
    }
    
    if err := db.Save(job).Error; err != nil {
        return c.Render(500, r.JSON(err))
    }
    
    return c.Render(200, r.JSON("Deployment queued"))
}

// Background worker (run as goroutine or separate process)
func deploymentWorker() {
    for {
        var job DeploymentJob
        db.Where("status = ?", "pending").First(&job)
        
        job.Status = "deploying"
        db.Save(&job)
        
        if err := executeDeployment(job); err != nil {
            job.Status = "failed"
            job.Error = err.Error()
        } else {
            job.Status = "completed"
        }
        
        db.Save(&job)
        time.Sleep(1 * time.Second)
    }
}
```

**Rating:** ⭐⭐⭐⭐⭐ (Best for production, moderate complexity)

---

## 🏆 Recommendation by Use Case

| Use Case | Recommended | Why |
|----------|-------------|-----|
| **Development/Testing** | Option 1 (Tasks) | Simple, easy to test manually |
| **Small Project** | Option 2 (Goroutine) | Quick setup, low overhead |
| **Production Single Server** | Option 3 (External Service) | Robust with systemd supervision |
| **Production Multi-Server** | Option 4 (Goroutine + Queue) | Scalable, persistent, monitored |
| **Enterprise** | Option 4 (Goroutine + Queue) | Full audit trail, retry logic |

---

## 📋 Decision Matrix

```
                  Simplicity  Speed   Reliability  Scalability  Monitoring
Option 1 (Tasks)      ★★★★★   ★★☆☆☆    ★★★☆☆      ★★☆☆☆      ★★★☆☆
Option 2 (Goroutine)  ★★★★★   ★★★★★    ★★☆☆☆      ★☆☆☆☆      ★☆☆☆☆
Option 3 (systemd)    ★★☆☆☆   ★★★☆☆    ★★★★★      ★★★★☆      ★★★★★
Option 4 (Queue)      ★★★☆☆   ★★★★☆    ★★★★★      ★★★★★      ★★★★★
```

---

## 🚀 Phased Implementation Strategy

### Phase 1: Development (Use Option 1 - Tasks)
```
Immediate (Now):
- Create Buffalo task: grifts/deploy.go
- Manual testing with: buffalo deploy:build
- Easy debugging and iteration
```

### Phase 2: Manual Testing (Option 1 still)
```
Next step:
- Test via webhook by triggering manually
- Verify git pull → build → restart works
- Fix any issues
```

### Phase 3: Production Single Server (Option 3)
```
For deployment:
- Create systemd service (api21-deployer)
- Webhook sends request to deployer service
- systemd handles restart on failure
```

### Phase 4: Production Scalability (Option 4)
```
For scale:
- Add deployment job queue to database
- Multiple worker goroutines
- Full deployment history and monitoring
- Retry logic for failures
```

---

## 🎯 Recommended Hybrid Approach (Best of Both)

**For your current scenario (single server), I recommend:**

### Option 1 + 2 Hybrid (Tasks + Goroutine)

**Implementation:**
```go
// In webhook.go
func handlePushEvent(c buffalo.Context, payload GitHubWebhookPayload) {
    // Trigger deployment asynchronously
    go func() {
        // Call Buffalo task runner to execute deployment
        runDeploymentTask()
    }()
    
    // Return response immediately (non-blocking)
    return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
        "status": "deployment_initiated",
        "message": "Build process started in background",
    }))
}

// In grifts/deploy.go
func init() {
    gob.Namespace("deploy", func() {
        gob.Task("build", "Deploy latest build", deployTask)
    })
}

func deployTask(c *gob.Context) error {
    // 1. Pull latest changes
    // 2. Build binary
    // 3. Stop old process
    // 4. Start new process
    // 5. Log results
}
```

**Advantages:**
- ✅ Non-blocking webhook response
- ✅ Reusable task code (manual CLI or webhook)
- ✅ Centralized deployment logic
- ✅ Built-in Buffalo support
- ✅ Easy to debug
- ✅ Simple setup
- ✅ Zero external dependencies

**Limitations (acknowledge & plan for):**
- App crash loses in-progress deployment (upgrade to Option 4 later)
- Multiple concurrent webhooks could cause conflicts (add file lock)
- No persistent history (add to database later)

---

## 🔄 Process Flow: Recommended Approach

```
GitHub Event (PR Merge / Push)
        ↓
        └─→ Webhook Handler (quick response)
                ↓
                └─→ Spawn Goroutine (non-blocking)
                        ↓
                        └─→ Execute Buffalo Task (grifts/deploy.go)
                                ↓
                                ├─→ 1. git pull origin main
                                ├─→ 2. go build -o bin/api21 ./cmd/app
                                ├─→ 3. Kill old process (pid from file)
                                ├─→ 4. Start new: ./bin/api21
                                └─→ 5. Log completion
                                        ↓
                                        (Back to serving requests)
```

---

## 🛠️ Technical Implementation Details

### 1. Git Pull Strategy
```bash
# Safe pull on main branch
cd /path/to/repo
git fetch origin
git reset --hard origin/main
```

### 2. Build Strategy
```bash
# Build in temp location first, verify, then swap
go build -o bin/api21.new ./cmd/app
if [ $? -eq 0 ]; then
    cp bin/api21.new bin/api21
else
    exit 1  # Build failed
fi
```

### 3. Process Management Strategy
```bash
# Save current PID to file
echo $$ > /tmp/api21.pid

# On deployment, kill old process
OLD_PID=$(cat /tmp/api21.pid)
kill -9 $OLD_PID

# Start new, save new PID
./bin/api21 &
echo $! > /tmp/api21.pid
```

### 4. Lock File to Prevent Concurrent Deploys
```bash
# Prevent multiple builds running simultaneously
LOCK_FILE="/tmp/api21.deploy.lock"

if [ -f $LOCK_FILE ]; then
    exit 1  # Another deployment in progress
fi

touch $LOCK_FILE
# ... do deployment ...
rm $LOCK_FILE
```

---

## 📊 Implementation Roadmap

```
Week 1: Development Setup
├─ Create grifts/deploy.go (Buffalo task)
├─ Write deployment shell script
├─ Test locally with manual triggers
└─ Add to webhook handler

Week 2: Testing & Refinement
├─ Test with real GitHub webhooks
├─ Handle edge cases (build failures)
├─ Add rollback capability
└─ Document process

Week 3: Production Hardening
├─ Add deployment logging to database
├─ Implement monitoring/alerting
├─ Create systemd service (optional)
└─ Deploy to production

Week 4+: Scale & Monitor
├─ Add job queue if needed
├─ Set up CI/CD monitoring
├─ Implement metrics
└─ Optimize based on learnings
```

---

## ⚠️ Important Considerations

### Downtime
- Deployment causes brief downtime during process swap
- Consider: Background workers, graceful shutdown
- Future: Blue-green deployment strategy

### Rollback
- Keep previous binary for quick rollback
- Plan: Keep last 3 builds

### Conflicts
- What if deployment crashes during build?
- Plan: Add health checks post-deployment

### Logging
- Capture deployment output
- Store in database for history
- Make accessible via API endpoint

### Security
- Verify webhook signature (already done ✅)
- Restrict deployment to main branch only ✅
- Run deployment as service user (not root)

---

## 📚 Next Steps

**I recommend starting with:**
1. Create `grifts/deploy.go` with Buffalo task
2. Implement git pull → build → kill → restart logic
3. Call task from webhook handler in goroutine
4. Test with manual triggers first
5. Test with GitHub webhooks
6. Monitor and refine

**Then upgrade to:**
- Add deployment logging to database
- Implement health checks
- Add systemd service for supervision
- Eventually add queue for scale

---

## 💡 Quick Start Code Structure

```
/workspaces/api21/
├── grifts/
│   └── deploy.go              ← NEW: Deployment task
├── actions/
│   ├── webhook.go             ← UPDATE: Call deploy task
│   └── deployment.go           ← NEW: Deployment logic
├── lib/
│   └── deployer/
│       └── deployer.go        ← NEW: Shell execution helpers
└── docs/
    └── DEPLOYMENT.md          ← NEW: Process documentation
```

---

## ✅ Summary

**My Recommendation:**

**Use Option 1 + 2 Hybrid (Buffalo Tasks + Goroutine)** for your use case:

1. **Immediate benefit** - Simple, no external dependencies
2. **Non-blocking** - Webhook returns immediately
3. **Reusable** - Task can be run manually or via webhook
4. **Upgradeable** - Easy to migrate to more robust approaches
5. **Production-ready** - Works well for single-server deployments

**Start with grifts/deploy.go task, call it from webhook handler asynchronously.**

Would you like me to implement this now? I can create:
1. ✅ `grifts/deploy.go` - Buffalo task for deployment
2. ✅ `actions/deployment.go` - Helper functions for git/build/restart
3. ✅ Update `actions/webhook.go` - Call task from handler
4. ✅ `docs/DEPLOYMENT.md` - Complete deployment guide

Ready to proceed? 🚀

