package cron_jobs

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/robfig/cron/v3"
)

// PingJobWithConfig creates a ping job with custom configuration
func PingJobWithConfig(url, schedule string) *PingJob {
	return &PingJob{
		pingURL:  url,
		schedule: schedule,
	}
}

// ValidateSchedule validates if the cron schedule is valid
func ValidateSchedule(schedule string) error {
	tempCron := cron.New()
	_, err := tempCron.AddFunc(schedule, func() {})
	return err
}

// TestPing performs a one-time ping to test connectivity
func TestPing(url string) error {
	log.Printf("Testing ping to URL: %s", url)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("failed to ping %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("✅ Successfully pinged %s - Status: %d", url, resp.StatusCode)
		return nil
	}

	return fmt.Errorf("ping to %s returned non-success status: %d", url, resp.StatusCode)
}

// GetConfigFromEnv returns the current environment configuration
func GetConfigFromEnv() map[string]string {
	return map[string]string{
		"PING_URL":      os.Getenv("PING_URL"),
		"PING_SCHEDULE": os.Getenv("PING_SCHEDULE"),
	}
}
