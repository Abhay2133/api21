package http

import (
	"net/http"

	"github.com/abhay2133/api21/internal/delivery/http/handler"
	"github.com/abhay2133/api21/internal/delivery/http/middleware"
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
) *gin.Engine {
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global Middlewares
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.ForceSSL(env))
	r.Use(middleware.CORS())
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

	// Catch-all for undefined routes
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if len(path) >= 5 && path[:5] == "/api/" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "API route not found",
			})
			return
		}
		// Fallback other routes to index.html docs
		c.File("./static/index.html")
	})

	return r
}
