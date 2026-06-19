package actions

import (
	"net/http"

	"github.com/abhay2133/api21/models"
	"github.com/gin-gonic/gin"
)

// HealthHandler returns the health status of database and cache connections
func HealthHandler(c *gin.Context) {
	dbStatus := "down"
	if models.DB != nil {
		err := models.DB.Exec("SELECT 1").Error
		if err == nil {
			dbStatus = "up"
		}
	}

	redisStatus := "down"
	if RedisClient != nil {
		_, err := RedisClient.Ping(c.Request.Context()).Result()
		if err == nil {
			redisStatus = "up"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":   "ok",
			"postgres": dbStatus, // compatible key mapping sqlite status
			"redis":    redisStatus,
		},
	})
}
