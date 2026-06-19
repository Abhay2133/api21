package actions

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// SetupRouter creates and configures the Gin engine.
func SetupRouter() *gin.Engine {
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Default middlewares
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Force SSL in production
	r.Use(ForceSSL())

	// Custom Rate Limiting for APIs
	r.Use(RateLimiterMiddleware())

	// API Routes
	r.GET("/api/v1/health", HealthHandler)

	// Bun SSR Server URL
	ssrURL := os.Getenv("SSR_SERVER_URL")
	if ssrURL == "" {
		ssrURL = "http://localhost:8081"
	}

	// Catch-all route to serve static assets or proxy to Bun SSR
	r.NoRoute(ServeAssetsOrSSR(ssrURL))

	return r
}

// ForceSSL redirects HTTP requests to HTTPS in production.
func ForceSSL() gin.HandlerFunc {
	return func(c *gin.Context) {
		env := os.Getenv("GO_ENV")
		if env == "production" {
			// Check header injected by reverse proxy
			proto := c.GetHeader("X-Forwarded-Proto")
			if proto != "https" && c.Request.Header.Get("X-Forwarded-SSL") != "on" {
				host := c.Request.Host
				target := "https://" + host + c.Request.RequestURI
				c.Redirect(http.StatusMovedPermanently, target)
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

// ServeAssetsOrSSR checks if request is for a static file (production only)
// and serves it, otherwise proxies the request to the Bun SSR server.
func ServeAssetsOrSSR(ssrURL string) gin.HandlerFunc {
	target, err := url.Parse(ssrURL)
	if err != nil {
		log.Fatalf("[proxy] invalid SSR target URL: %s", err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// If the request starts with /api/ and wasn't matched by other routes, return a 404 JSON response
		if strings.HasPrefix(path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "API route not found",
			})
			return
		}

		env := os.Getenv("GO_ENV")
		if env == "" {
			env = "development"
		}

		// In production, try to serve from local static assets first
		if env == "production" {
			// Clean path to prevent directory traversal
			cleanPath := filepath.Clean(path)
			
			// We serve files from frontend/dist/client
			localFile := filepath.Join("frontend", "dist", "client", cleanPath)
			
			// Check if file exists and is not a directory
			info, err := os.Stat(localFile)
			if err == nil && !info.IsDir() {
				c.File(localFile)
				return
			}
		}

		// Proxy fallback for SSR pages (and client assets in development)
		// Modify the request host header for reverse proxy compatibility
		c.Request.Host = target.Host
		
		// If request is index.html, we don't want the raw template returned
		if strings.HasSuffix(path, "index.html") {
			c.Request.URL.Path = "/"
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
