# Cron Jobs

This package provides cron job functionality for the API21 application.

## Features

- **Ping Job**: Automatically pings a configured URL at specified intervals
- **Manager**: Centralized management of all cron jobs
- **Graceful Shutdown**: Properly stops all cron jobs when the application shuts down

## Configuration

The cron jobs are configured using environment variables:

### Ping Job

- `PING_URL`: The URL to ping (required for the ping job to start)
- `PING_SCHEDULE`: Cron schedule expression (default: `*/5 * * * *` - every 5 minutes)

### Schedule Format

The schedule uses standard cron syntax with 5 fields:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples

- `*/5 * * * *` - Every 5 minutes
- `0 */1 * * *` - Every hour
- `0 9 * * 1-5` - Every weekday at 9:00 AM
- `0 0 * * 0` - Every Sunday at midnight

## Usage

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Required for ping job to start
PING_URL=https://your-app.herokuapp.com/health

# Optional: Custom schedule (default is every 5 minutes)
PING_SCHEDULE="*/10 * * * *"
```

### API Endpoints

- `GET /cron/status` - Get the status of all cron jobs

### Example Response

```json
{
  "manager_started": true,
  "ping_job": {
    "ping_url": "https://your-app.herokuapp.com/health",
    "schedule": "*/5 * * * *",
    "running": true,
    "next_run": "2025-08-29 10:35:00"
  }
}
```

## Use Cases

### Keep Heroku App Awake

Heroku free tier apps go to sleep after 30 minutes of inactivity. You can use the ping job to keep your app awake:

```bash
# Set your app's health endpoint as the ping URL
PING_URL=https://your-app.herokuapp.com/health

# Ping every 25 minutes to prevent sleeping
PING_SCHEDULE="*/25 * * * *"
```

### Health Monitoring

Monitor external services or APIs:

```bash
# Monitor an external API
PING_URL=https://api.external-service.com/health

# Check every 2 minutes
PING_SCHEDULE="*/2 * * * *"
```

### Webhook Notifications

Send periodic notifications to webhook endpoints:

```bash
# Webhook URL
PING_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Daily at 9 AM
PING_SCHEDULE="0 9 * * *"
```

## Implementation Details

- Uses the `github.com/robfig/cron/v3` library for scheduling
- HTTP client has a 30-second timeout for ping requests
- Logs all ping attempts and their results
- Gracefully handles missing environment variables
- Thread-safe manager with mutex protection

## Testing

Run the tests:

```bash
go test ./internal/cron_jobs/...
```

The tests cover:
- Job initialization with different configurations
- Manager start/stop functionality
- Status reporting
- Environment variable handling
