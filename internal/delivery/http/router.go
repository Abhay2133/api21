package http

import (
	"net/http"

	"github.com/abhay2133/api21/config"
	"github.com/abhay2133/api21/internal/delivery/http/handler"
	"github.com/abhay2133/api21/internal/delivery/http/middleware"
	"github.com/abhay2133/api21/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func NewRouter(
	env string,
	dbConn *gorm.DB,
	redisClient *redis.Client,
	userHandler *handler.UserHandler,
	healthHandler *handler.HealthHandler,
	adminHandler *handler.AdminHandler,
	sessionUsecase domain.SessionUsecase,
) *gin.Engine {
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global Middlewares
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.ForceSSL(env))
	r.Use(middleware.RateLimiter(redisClient))

	// Serve Static Docs at the root
	r.StaticFile("/", "./static/index.html")
	r.StaticFile("/index.html", "./static/index.html")

	// API Routes Group
	api := r.Group("/api/v1")
	{
		api.GET("/health", healthHandler.GetHealth)

		// User endpoints
		api.GET("/users", userHandler.GetUsers)
		api.GET("/users/:id", userHandler.GetUserByID)
		api.POST("/users", userHandler.CreateUser)
		api.DELETE("/users/:id", userHandler.DeleteUser)
	}

	// Custom CORS middleware for API
	apiCors := middleware.CORS()

	// Custom CORS middleware for Admin
	adminCors := func(c *gin.Context) {
		config.AppConfig.RLock()
		allowed := config.AppConfig.AllowedAdminOrigin
		config.AppConfig.RUnlock()

		origin := c.GetHeader("Origin")
		if origin == allowed || origin == "http://localhost:5173" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}

	// Handle CORS globally based on path
	r.Use(func(c *gin.Context) {
		path := c.Request.URL.Path
		if len(path) >= 6 && path[:6] == "/admin" {
			adminCors(c)
		} else if len(path) >= 7 && path[:7] == "/api/v1" {
			apiCors(c)
		} else {
			c.Next()
		}
	})

	// Admin Routes Group
	adminGroup := r.Group("/admin")

	// Public Admin routes
	adminGroup.POST("/login", adminHandler.Login)
	adminGroup.GET("/terminal", adminHandler.WebTerminal)

	// Protected Admin routes
	protectedAdmin := adminGroup.Group("")
	protectedAdmin.Use(middleware.AdminAuth(sessionUsecase))
	{
		protectedAdmin.GET("/metrics", adminHandler.GetSystemMetrics)
		protectedAdmin.GET("/env", adminHandler.GetEnvVars)
		protectedAdmin.POST("/env", adminHandler.UpdateEnvVars)
		protectedAdmin.GET("/sessions", adminHandler.GetSessions)
		protectedAdmin.DELETE("/sessions/:id", adminHandler.RevokeSession)
		protectedAdmin.POST("/logout", adminHandler.Logout)
	}

	// Catch-all for undefined routes
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if len(path) >= 5 && path[:5] == "/api/" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "API route not found",
			})
			return
		}
		if len(path) >= 7 && path[:7] == "/admin/" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Admin API route not found",
			})
			return
		}
		// Fallback other routes to index.html docs
		c.File("./static/index.html")
	})

	return r
}

