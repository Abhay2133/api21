package actions

import (
	"fmt"
	"net/http"
	"runtime"

	"github.com/gobuffalo/buffalo"
)

// HomeHandler is a default handler to serve up
// a home page.
func HomeHandler(c buffalo.Context) error {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	response := map[string]interface{}{
		"status":     "UP",
		"version":    "0.0.1",
		"ram_usage":  formatBytes(m.Alloc),
		"ram_total":  formatBytes(m.TotalAlloc),
		"ram_sys":    formatBytes(m.Sys),
		"goroutines": runtime.NumGoroutine(),
	}

	return c.Render(http.StatusOK, r.JSON(response))
}

// formatBytes converts bytes to human-readable format
func formatBytes(bytes uint64) string {
	units := []string{"B", "KB", "MB", "GB", "TB"}
	size := float64(bytes)
	unitIndex := 0

	for size >= 1024 && unitIndex < len(units)-1 {
		size /= 1024
		unitIndex++
	}

	return fmt.Sprintf("%.2f %s", size, units[unitIndex])
}
