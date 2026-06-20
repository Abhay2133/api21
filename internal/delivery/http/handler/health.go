package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db          *gorm.DB
	redisClient *redis.Client
}

func NewHealthHandler(db *gorm.DB, redisClient *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:          db,
		redisClient: redisClient,
	}
}

func (h *HealthHandler) GetHealth(c *gin.Context) {
	dbStatus := "down"
	if h.db != nil {
		sqlDB, err := h.db.DB()
		if err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			err = sqlDB.PingContext(ctx)
			cancel()
			if err == nil {
				dbStatus = "up"
			}
		}
	}

	redisStatus := "down"
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		_, err := h.redisClient.Ping(ctx).Result()
		cancel()
		if err == nil {
			redisStatus = "up"
		}
	}

	status := "ok"
	if dbStatus == "down" || redisStatus == "down" {
		status = "degraded"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":   status,
			"postgres": dbStatus,
			"redis":    redisStatus,
		},
	})
}
