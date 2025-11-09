package actions

import (
	"fmt"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/envy"
)

// RedeployAuthMiddleware validates the REDEPLOY_TOKEN header for redeploy endpoints
// Token should be passed as: Authorization: Bearer <token>
// Returns a Buffalo middleware function
func RedeployAuthMiddleware() buffalo.MiddlewareFunc {
	return func(next buffalo.Handler) buffalo.Handler {
		return func(c buffalo.Context) error {
			// Get the expected token from environment variable
			expectedToken := envy.Get("REDEPLOY_TOKEN", "")

			// If no token is configured, skip auth (for development)
			if expectedToken == "" && ENV == "development" {
				return next(c)
			}

			// If no token configured but in production, require authentication
			if expectedToken == "" {
				return c.Render(500, r.JSON(map[string]interface{}{
					"error": "REDEPLOY_TOKEN not configured",
				}))
			}

			// Get Authorization header
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.Render(401, r.JSON(map[string]interface{}{
					"error": "missing Authorization header",
				}))
			}

			// Extract bearer token
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.Render(401, r.JSON(map[string]interface{}{
					"error": "invalid Authorization header format, expected: Bearer <token>",
				}))
			}

			token := parts[1]

			// Compare tokens (constant-time comparison to prevent timing attacks)
			if !constantTimeCompare(token, expectedToken) {
				fmt.Printf("Invalid redeploy token attempt\n")
				return c.Render(403, r.JSON(map[string]interface{}{
					"error": "invalid or expired token",
				}))
			}

			// Token is valid, continue to next handler
			return next(c)
		}
	}
}

// constantTimeCompare performs constant-time string comparison
// This prevents timing attacks where attackers could measure response time
// to determine correct token characters
func constantTimeCompare(a, b string) bool {
	if len(a) != len(b) {
		return false
	}

	result := 0
	for i := range a {
		result |= int(a[i]) ^ int(b[i])
	}

	return result == 0
}
