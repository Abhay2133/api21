# Redeploy Security Implementation

## Overview

The redeploy endpoints are now protected with **token-based authentication** using Bearer tokens. This prevents unauthorized access to your deployment system.

## Authentication Mechanism

### How It Works

1. **Token Generation**: Generate a strong random token (recommend 32+ bytes)
2. **Token Storage**: Store token in `REDEPLOY_TOKEN` environment variable
3. **Client Request**: Include token in `Authorization: Bearer <token>` header
4. **Verification**: Constant-time comparison prevents timing attacks
5. **Response**: 401/403 on auth failure, proceed on success

### Security Features

✅ **Constant-Time Comparison** - Prevents timing attacks  
✅ **Bearer Token Scheme** - Industry standard (RFC 6750)  
✅ **Header-Based Auth** - Separate from URL/body  
✅ **Development Mode** - Auto-skip auth when not configured  
✅ **Production Safe** - Requires token in production  

## Setup

### 1. Generate a Strong Token

**Option A: Using OpenSSL** (Recommended)
```bash
openssl rand -hex 32
# Output example: a7f3e8d2c1b9f4a6e8c2d7f1a3b5e8f0c2a4d6e8f0a1b3c5d7e9f1a3b5c7d9
```

**Option B: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Option C: Using Go**
```bash
go run -c 'package main; import ("fmt"; "crypto/rand"; "hex") func main() { b := make([]byte, 32); rand.Read(b); fmt.Println(hex.EncodeToString(b)) }'
```

### 2. Configure Environment Variable

**Development** (`.env`):
```bash
# Leave empty to skip authentication in development
REDEPLOY_TOKEN=
```

**Production** (`.env.production`):
```bash
REDEPLOY_TOKEN=a7f3e8d2c1b9f4a6e8c2d7f1a3b5e8f0c2a4d6e8f0a1b3c5d7e9f1a3b5c7d9
```

**Docker/Environment**:
```bash
export REDEPLOY_TOKEN="a7f3e8d2c1b9f4a6e8c2d7f1a3b5e8f0c2a4d6e8f0a1b3c5d7e9f1a3b5c7d9"
```

**GitHub Actions Secret**:
```
Name: REDEPLOY_SECRET
Value: a7f3e8d2c1b9f4a6e8c2d7f1a3b5e8f0c2a4d6e8f0a1b3c5d7e9f1a3b5c7d9
```

### 3. Update Workflow (GitHub Actions)

Edit `.github/workflows/ci-cd.yml`:

```yaml
redeploy:
  steps:
    - name: Trigger redeploy endpoint
      run: |
        curl -X POST \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${{ secrets.REDEPLOY_SECRET }}" \
          "${{ secrets.REDEPLOY_URL }}/api/redeploy"
```

## API Usage

### With Authentication Token

**cURL Example**:
```bash
# Trigger redeploy
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  http://localhost:5000/api/redeploy

# Check status
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:5000/api/redeploy/1
```

**JavaScript/Node.js**:
```javascript
const token = 'your-secret-token';
const response = await fetch('http://localhost:5000/api/redeploy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

**Python**:
```python
import requests

token = 'your-secret-token'
headers = {'Authorization': f'Bearer {token}'}
response = requests.post(
    'http://localhost:5000/api/redeploy',
    headers=headers
)
```

**Bash Script**:
```bash
#!/bin/bash
TOKEN="your-secret-token"
API_URL="http://localhost:5000"

# Trigger redeploy
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/redeploy"
```

### Error Responses

**Missing Authorization Header** (401):
```json
{
  "error": "missing Authorization header"
}
```

**Invalid Format** (401):
```json
{
  "error": "invalid Authorization header format, expected: Bearer <token>"
}
```

**Invalid Token** (403):
```json
{
  "error": "invalid or expired token"
}
```

**Not Configured** (500):
```json
{
  "error": "REDEPLOY_TOKEN not configured"
}
```

## Security Best Practices

### 1. Token Generation

✅ **DO** - Use cryptographically secure random generators
```bash
openssl rand -hex 32  # 64 characters (256 bits)
```

❌ **DON'T** - Use weak/predictable tokens
```bash
echo "mytoken123"  # Weak and guessable
```

### 2. Token Storage

✅ **DO** - Use environment variables
```bash
REDEPLOY_TOKEN="..."
```

✅ **DO** - Use GitHub Secrets
```yaml
Authorization: Bearer ${{ secrets.REDEPLOY_SECRET }}
```

✅ **DO** - Use Docker secrets
```bash
docker secret create redeploy_token token.txt
```

❌ **DON'T** - Commit tokens to repository
```bash
git add .env  # Never!
```

❌ **DON'T** - Log tokens
```bash
echo "Token: $REDEPLOY_TOKEN"  # Avoid logging
```

### 3. Transport Security

✅ **DO** - Use HTTPS in production
```bash
GO_ENV=production  # Forces HTTPS redirect
```

✅ **DO** - Use Bearer token scheme
```
Authorization: Bearer <token>
```

❌ **DON'T** - Send tokens in URLs
```
GET /api/redeploy?token=xyz  # Never!
```

❌ **DON'T** - Use unencrypted HTTP
```
GO_ENV=development  # Only for dev
```

### 4. Token Rotation

**Rotate tokens:**
1. Generate new token: `openssl rand -hex 32`
2. Update environment variable
3. Update GitHub secrets
4. Restart application
5. Verify new deployments work
6. Remove old token from documentation

**Rotation Schedule:**
- Development: Every 6 months or after breach
- Production: Every 3 months or after breach
- After team changes: Immediately

### 5. Monitoring

**Log failed attempts:**
```bash
# Check server logs for failed auth attempts
docker logs api21-server | grep "Invalid redeploy token"
```

**Alert on failures:**
- Set up alerts for repeated 401/403 responses
- Monitor API error rates
- Track authentication failure patterns

## Development vs Production

### Development Mode

**Behavior** (with `GO_ENV=development`):
- If `REDEPLOY_TOKEN` is **empty**: Auth is **skipped**
- If `REDEPLOY_TOKEN` is **set**: Auth is **enforced**

**Example**:
```bash
GO_ENV=development
REDEPLOY_TOKEN=  # Empty - auth skipped
# Now you can call API without token:
curl -X POST http://localhost:5000/api/redeploy
```

### Production Mode

**Behavior** (with `GO_ENV=production`):
- `REDEPLOY_TOKEN` is **always required**
- Missing token → 500 error
- Invalid token → 401/403 error

**Example**:
```bash
GO_ENV=production
REDEPLOY_TOKEN=a7f3e8d2...  # Required
# Must include token in all requests:
curl -X POST \
  -H "Authorization: Bearer a7f3e8d2..." \
  https://your-api.com/api/redeploy
```

## Testing

### Test Missing Token

```bash
curl -X POST http://localhost:5000/api/redeploy
# Expected: 401 Unauthorized
# Response: {"error":"missing Authorization header"}
```

### Test Invalid Format

```bash
curl -X POST \
  -H "Authorization: InvalidFormat token" \
  http://localhost:5000/api/redeploy
# Expected: 401 Unauthorized
```

### Test Wrong Token

```bash
curl -X POST \
  -H "Authorization: Bearer wrong-token" \
  http://localhost:5000/api/redeploy
# Expected: 403 Forbidden
```

### Test Valid Token

```bash
export TOKEN="your-actual-token"
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/redeploy
# Expected: 202 Accepted (deployment triggered)
```

## Troubleshooting

### "missing Authorization header"

**Cause**: No Authorization header in request

**Solution**:
```bash
# Add header to request
curl -H "Authorization: Bearer your-token" http://localhost:5000/api/redeploy
```

### "invalid Authorization header format"

**Cause**: Wrong format (not "Bearer <token>")

**Solution**:
```bash
# Correct format
curl -H "Authorization: Bearer your-token"

# Wrong formats
curl -H "Authorization: your-token"           # No "Bearer"
curl -H "Authorization: Basic your-token"     # Wrong scheme
curl -H "Token: your-token"                   # Wrong header name
```

### "invalid or expired token"

**Cause**: Token doesn't match `REDEPLOY_TOKEN`

**Solution**:
1. Verify token value: `echo $REDEPLOY_TOKEN`
2. Verify environment: `echo $GO_ENV`
3. Copy token correctly (no extra spaces)
4. Regenerate token if unsure

### "REDEPLOY_TOKEN not configured" (500)

**Cause**: Token missing in production

**Solution**:
```bash
# Set token
export REDEPLOY_TOKEN="your-token"

# Or in .env
echo "REDEPLOY_TOKEN=your-token" >> .env

# Restart server
make start-smart
```

## Timing Attack Prevention

The authentication uses **constant-time comparison** to prevent timing attacks.

**What is a timing attack?**
- Attacker measures response time to guess token
- Different bytes fail faster than correct bytes
- Example: Response takes 50ms for correct first byte, 10ms for wrong

**How we prevent it:**
```go
// Always compares ALL characters, even after finding a mismatch
result := 0
for i := range a {
    result |= int(a[i]) ^ int(b[i])  // XOR all bytes
}
return result == 0  // Only evaluate result at end
```

**Result**: Response time is **always the same**, regardless of when token fails

## Additional Security Measures

### IP Whitelisting (Optional)

Add to your proxy (nginx/Apache):
```nginx
location /api/redeploy {
    allow 192.168.1.0/24;      # Your network
    allow 203.0.113.0/24;      # GitHub Actions IPs
    deny all;
}
```

### Rate Limiting (Optional)

Add rate limiting middleware:
```go
// Limit to 5 requests per minute per IP
app.Use(ratelimit.NewRateLimiter(5, time.Minute))
```

### HTTPS Only (Required)

Enabled automatically in production:
```go
SSLRedirect: ENV == "production"  // Forces HTTPS
```

## Support

For security issues:
1. Check `.github/workflows/ci-cd.yml` for correct header format
2. Verify token using: `echo $REDEPLOY_TOKEN`
3. Test locally with known good token
4. Check application logs: `docker logs api21-server`
5. Review: `docs/redeploy/troubleshooting.md`

## References

- [RFC 6750 - The OAuth 2.0 Bearer Token Usage](https://tools.ietf.org/html/rfc6750)
- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Buffalo Authorization Middleware](https://gobuffalo.io/en/docs/reference/middleware)
