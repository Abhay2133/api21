package src

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/robfig/cron/v3"
)

// RegisterCronJobs sets up and starts cron jobs, returning a pointer to the cron.Cron instance
func RegisterCronJobs() *cron.Cron {
	// Create a new cron scheduler with second precision
	c := cron.New(cron.WithSeconds())

	// Job 1: Memory monitoring job that runs every minute
	_, err := c.AddFunc("0 * * * * *", func() {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)

		log.Printf("[CRON] Memory Monitor - Time: %s, Memory Usage: Alloc=%d KB, TotalAlloc=%d KB, Sys=%d KB, NumGC=%d",
			time.Now().Format("2006-01-02 15:04:05"),
			bToKb(m.Alloc),
			bToKb(m.TotalAlloc),
			bToKb(m.Sys),
			m.NumGC,
		)
	})
	if err != nil {
		log.Printf("[CRON] Failed to register memory monitoring job: %v", err)
	} else {
		log.Println("[CRON] Memory monitoring job registered (runs every minute)")
	}

	// Job 2: URL ping job based on environment variables
	setupPingJob(c)

	// Start the cron scheduler
	c.Start()
	log.Println("[CRON] Cron scheduler started")

	return c
}

// setupPingJob configures the URL ping job based on environment variables
func setupPingJob(c *cron.Cron) {
	pingURL := os.Getenv("PING_URL")
	pingIntervalStr := os.Getenv("PING_INTERVAL")

	// Check if environment variables are set
	if pingURL == "" {
		log.Println("[CRON] PING_URL environment variable not set, skipping ping job")
		return
	}

	if pingIntervalStr == "" {
		log.Println("[CRON] PING_INTERVAL environment variable not set, skipping ping job")
		return
	}

	// Parse the ping interval
	pingInterval, err := strconv.Atoi(pingIntervalStr)
	if err != nil || pingInterval <= 0 {
		log.Printf("[CRON] Invalid PING_INTERVAL value '%s', must be a positive integer (minutes), skipping ping job", pingIntervalStr)
		return
	}

	// Create cron expression for the specified interval
	cronExpr := fmt.Sprintf("0 */%d * * * *", pingInterval)

	// Add the ping job
	_, err = c.AddFunc(cronExpr, func() {
		pingURL := os.Getenv("PING_URL") // Re-read in case it changes
		if pingURL == "" {
			log.Println("[CRON] PING_URL is empty, skipping ping")
			return
		}

		startTime := time.Now()
		log.Printf("[CRON] Pinging URL: %s", pingURL)

		// Create HTTP client with timeout
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		// Send GET request
		resp, err := client.Get(pingURL)
		duration := time.Since(startTime)

		if err != nil {
			log.Printf("[CRON] Ping failed for %s after %v: %v", pingURL, duration, err)
			return
		}
		defer resp.Body.Close()

		log.Printf("[CRON] Ping successful for %s - Status: %d %s, Duration: %v",
			pingURL, resp.StatusCode, resp.Status, duration)
	})

	if err != nil {
		log.Printf("[CRON] Failed to register ping job: %v", err)
	} else {
		log.Printf("[CRON] URL ping job registered (pings %s every %d minutes)", pingURL, pingInterval)
	}
}

// bToKb converts bytes to kilobytes
func bToKb(b uint64) uint64 {
	return b / 1024
}
