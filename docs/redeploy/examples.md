# Redeploy API Examples

## Quick Start Examples

### JavaScript/Node.js

```javascript
// Trigger a redeploy
async function triggerRedeploy() {
  const response = await fetch('https://api.example.com/api/redeploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (response.status === 202) {
    const data = await response.json();
    console.log(`Deployment initiated: version ${data.version}`);
    
    // Poll for status
    return pollDeploymentStatus(data.version);
  }
  
  throw new Error(`Failed to initiate deployment: ${response.status}`);
}

// Poll deployment status
async function pollDeploymentStatus(version, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api.example.com/api/redeploy/${version}`
    );
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`Status: ${data.status}`);
      
      if (data.status === 'completed') {
        console.log('✓ Deployment completed successfully');
        return data;
      }
      
      if (data.status === 'failed') {
        throw new Error(`Deployment failed: ${data.error}`);
      }
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Deployment polling timeout');
}

// Usage
triggerRedeploy()
  .then(result => console.log('Deployment completed:', result))
  .catch(error => console.error('Error:', error));
```

---

### Python

```python
import requests
import time

def trigger_redeploy(base_url):
    """Trigger a redeploy and wait for completion"""
    
    # POST to trigger redeploy
    response = requests.post(f'{base_url}/api/redeploy')
    
    if response.status_code != 202:
        raise Exception(f'Failed to trigger redeploy: {response.status_code}')
    
    data = response.json()
    version = data['version']
    print(f"Deployment initiated: version {version}")
    
    # Poll for status
    return poll_deployment_status(base_url, version)


def poll_deployment_status(base_url, version, max_polls=60):
    """Poll deployment status until completion"""
    
    for attempt in range(max_polls):
        response = requests.get(f'{base_url}/api/redeploy/{version}')
        
        if response.status_code == 200:
            data = response.json()
            status = data['status']
            print(f"Attempt {attempt + 1}: Status = {status}")
            
            if status == 'completed':
                print("✓ Deployment completed successfully")
                return data
            
            if status == 'failed':
                raise Exception(f"Deployment failed: {data['error']}")
        
        # Wait before next poll
        time.sleep(2)
    
    raise Exception("Deployment polling timeout")


# Usage
if __name__ == '__main__':
    try:
        result = trigger_redeploy('https://api.example.com')
        print(f"Deployment result: {result}")
    except Exception as e:
        print(f"Error: {e}")
```

---

### cURL Commands

```bash
# Trigger a redeploy
curl -X POST https://api.example.com/api/redeploy \
  -H "Content-Type: application/json" \
  -v

# Expected response (202 Accepted):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "version": 5,
#   "status": "pending",
#   "message": "Redeployment initiated"
# }

# Check deployment status
VERSION=5
curl https://api.example.com/api/redeploy/$VERSION \
  -H "Content-Type: application/json" \
  -v

# Expected response (200 OK):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "version": 5,
#   "status": "in_progress",
#   "message": "Main branch pulled successfully",
#   "started_at": "2025-11-09T12:30:45Z",
#   "created_at": "2025-11-09T12:30:40Z",
#   "updated_at": "2025-11-09T12:31:10Z"
# }

# Poll continuously until complete
while true; do
  curl -s https://api.example.com/api/redeploy/5 | jq '.status'
  sleep 2
done
```

---

### Bash Script with Retry Logic

```bash
#!/bin/bash

REDEPLOY_URL="https://api.example.com"
MAX_RETRIES=3
MAX_POLLS=120

# Function to trigger redeploy with retries
trigger_redeploy() {
    for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
        echo "Triggering redeploy (attempt $attempt/$MAX_RETRIES)..."
        
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "$REDEPLOY_URL/api/redeploy" \
            -H "Content-Type: application/json")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "202" ]; then
            echo "✓ Redeploy triggered successfully"
            echo "$BODY"
            return 0
        else
            echo "✗ Failed with HTTP $HTTP_CODE"
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo "Retrying in 10 seconds..."
                sleep 10
            fi
        fi
    done
    
    return 1
}

# Function to poll deployment status
poll_status() {
    local version=$1
    
    for ((poll=1; poll<=MAX_POLLS; poll++)); do
        echo "Polling status (attempt $poll/$MAX_POLLS)..."
        
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            "$REDEPLOY_URL/api/redeploy/$version" \
            -H "Content-Type: application/json")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            STATUS=$(echo "$BODY" | jq -r '.status')
            echo "Status: $STATUS"
            
            case "$STATUS" in
                completed)
                    echo "✓ Deployment completed"
                    return 0
                    ;;
                failed)
                    ERROR=$(echo "$BODY" | jq -r '.error // "Unknown error"')
                    echo "✗ Deployment failed: $ERROR"
                    return 1
                    ;;
                *)
                    echo "In progress..."
                    sleep 2
                    ;;
            esac
        else
            echo "✗ Status check failed with HTTP $HTTP_CODE"
            return 1
        fi
    done
    
    echo "✗ Polling timeout"
    return 1
}

# Main
if RESPONSE=$(trigger_redeploy); then
    VERSION=$(echo "$RESPONSE" | jq -r '.version')
    echo "Deployment version: $VERSION"
    
    if poll_status "$VERSION"; then
        echo "✓ Deployment successful"
        exit 0
    else
        echo "✗ Deployment failed"
        exit 1
    fi
else
    echo "✗ Failed to trigger redeploy"
    exit 1
fi
```

---

### Docker Integration

```dockerfile
# Dockerfile integration for redeployment
FROM golang:1.24.5 as builder

WORKDIR /app
COPY . .
RUN go mod download
RUN buffalo build -o bin/api21

FROM ubuntu:24.04

WORKDIR /app
COPY --from=builder /app/bin/api21 .
COPY --from=builder /app/scripts/start-smart.sh scripts/

# Copy database migrations
COPY migrations migrations/
COPY database.yml .

# Make startup script executable
RUN chmod +x scripts/start-smart.sh

EXPOSE 5000

# Use smart startup that handles versioning
CMD ["bash", "scripts/start-smart.sh"]
```

---

### GitHub Actions Workflow Integration

```yaml
name: Trigger Redeploy

on:
  push:
    branches: [ main ]

jobs:
  redeploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Trigger redeploy
      id: redeploy
      run: |
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
          "${{ secrets.REDEPLOY_URL }}/api/redeploy" \
          -H "Content-Type: application/json")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        VERSION=$(echo "$BODY" | jq -r '.version')
        
        echo "http_code=$HTTP_CODE" >> $GITHUB_OUTPUT
        echo "version=$VERSION" >> $GITHUB_OUTPUT
        echo "Response: $BODY"
        
        if [ "$HTTP_CODE" != "202" ]; then
          exit 1
        fi
    
    - name: Poll deployment status
      run: |
        VERSION=${{ steps.redeploy.outputs.version }}
        MAX_POLLS=120
        
        for ((i=1; i<=MAX_POLLS; i++)); do
          echo "Polling status (attempt $i/$MAX_POLLS)..."
          
          STATUS=$(curl -s "${{ secrets.REDEPLOY_URL }}/api/redeploy/$VERSION" \
            -H "Content-Type: application/json" | jq -r '.status')
          
          echo "Status: $STATUS"
          
          if [ "$STATUS" = "completed" ]; then
            echo "✓ Deployment completed"
            exit 0
          elif [ "$STATUS" = "failed" ]; then
            echo "✗ Deployment failed"
            exit 1
          fi
          
          sleep 2
        done
        
        echo "✗ Polling timeout"
        exit 1
```

---

### Monitoring and Dashboards

```sql
-- PostgreSQL query for deployment history
SELECT 
  version,
  status,
  message,
  error,
  EXTRACT(EPOCH FROM (completed_at - started_at))::INT as duration_seconds,
  started_at,
  completed_at
FROM redeployments
WHERE completed_at IS NOT NULL
ORDER BY version DESC
LIMIT 20;

-- Deployment statistics
SELECT 
  COUNT(*) as total_deployments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::NUMERIC, 2) as avg_duration_seconds
FROM redeployments
WHERE completed_at IS NOT NULL;

-- Failed deployments analysis
SELECT 
  version,
  error,
  created_at,
  updated_at
FROM redeployments
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

### Error Handling Examples

```javascript
// Comprehensive error handling
async function deployWithErrorHandling() {
  try {
    // Trigger redeploy
    const triggerResponse = await fetch(
      'https://api.example.com/api/redeploy',
      { method: 'POST' }
    );
    
    if (triggerResponse.status !== 202) {
      const error = await triggerResponse.json();
      console.error('Trigger failed:', error);
      throw new Error('Failed to trigger redeploy');
    }
    
    const { version } = await triggerResponse.json();
    console.log(`Deployment v${version} initiated`);
    
    // Poll with timeout
    const result = await pollWithTimeout(version, 300000); // 5 minute timeout
    console.log('✓ Deployment successful:', result);
    
  } catch (error) {
    if (error.message.includes('Polling timeout')) {
      console.error('Deployment took too long');
      // Implement manual checking or rollback
    } else if (error.message.includes('Network')) {
      console.error('Network error - server may be unreachable');
      // Implement retry logic
    } else {
      console.error('Deployment error:', error.message);
    }
  }
}

async function pollWithTimeout(version, timeout) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const response = await fetch(
      `https://api.example.com/api/redeploy/${version}`
    );
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'completed') {
      return data;
    }
    
    if (data.status === 'failed') {
      throw new Error(`Deployment failed: ${data.error}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('Polling timeout');
}
```

These examples demonstrate various ways to interact with the redeploy API from different programming languages and environments.
