package actions

import (
	"net/http"

	"github.com/abhay2133/api21/models"
	"github.com/gobuffalo/buffalo"
)

// HealthHandler returns the health status of database and cache connections
func HealthHandler(c buffalo.Context) error {
	dbStatus := "down"
	err := models.DB.RawQuery("SELECT 1").Exec()
	if err == nil {
		dbStatus = "up"
	}

	redisStatus := "down"
	if RedisClient != nil {
		_, err := RedisClient.Ping(c.Request().Context()).Result()
		if err == nil {
			redisStatus = "up"
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"status":   "ok",
			"postgres": dbStatus, // compatible key mapping sqlite status
			"redis":    redisStatus,
		},
	}))
}
