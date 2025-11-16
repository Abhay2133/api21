# Authentication

## Overview

This project uses a token-based authentication system with `refresh_token` and `access_token` patterns to handle both authentication and authorization across web and mobile clients.

## Token Pattern

- **Access Token**: Short-lived token used for API requests
- **Refresh Token**: Long-lived token used to obtain new access tokens

## Client-Specific Flows

### Web Applications
- Tokens are stored in **HTTP-only cookies**
- More secure against XSS attacks
- Automatic token refresh on cookie expiration

### Mobile Applications
- Both tokens returned in **JSON response body**
- Tokens stored in secure device storage

## Client Detection

Use the `X-Client-Type` request header to identify the client:

```
X-Client-Type: web      # Web application
X-Client-Type: mobile   # Mobile application
```

## Common Flows

### Login
1. Client sends credentials
2. Server validates and generates tokens
3. Response format depends on `X-Client-Type` header

### Token Refresh
1. Client sends refresh token
2. Server validates and issues new access token
3. Response format depends on `X-Client-Type` header

### Logout
1. Client clears stored tokens
2. Refresh token invalidated on server (optional)