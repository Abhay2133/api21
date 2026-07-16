package middleware

import (
	"net/http"
	"strings"

	"github.com/abhay2133/api21/internal/domain"
	"github.com/gin-gonic/gin"
)

// AdminAuth validates the opaque session token in the Authorization header
func AdminAuth(sessionUsecase domain.SessionUsecase) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
			return
		}

		token := parts[1]
		session, err := sessionUsecase.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session token"})
			return
		}

		// Store username and session details in context
		c.Set("username", session.Username)
		c.Set("session_token", session.Token)

		c.Next()
	}
}

