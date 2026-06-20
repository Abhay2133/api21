package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ForceSSL(env string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if env == "production" {
			proto := c.GetHeader("X-Forwarded-Proto")
			ssl := c.GetHeader("X-Forwarded-SSL")

			if proto != "https" && ssl != "on" {
				host := c.Request.Host
				targetURL := fmt.Sprintf("https://%s%s", host, c.Request.RequestURI)
				c.Redirect(http.StatusMovedPermanently, targetURL)
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
