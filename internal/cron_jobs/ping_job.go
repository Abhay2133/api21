package cron_jobs

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/robfig/cron/v3"
)

type PingJob struct {
	cron     *cron.Cron
	pingURL  string
	schedule string
}

// NewPingJob creates a new ping job instance
func NewPingJob() *PingJob {
	// Get URL and schedule from environment variables
	pingURL := os.Getenv("PING_URL")
	schedule := os.Getenv("PING_SCHEDULE")

	// Default schedule: every 5 minutes
	if schedule == "" {
		schedule = "*/5 * * * *" // Every 5 minutes
	}

	return &PingJob{
		cron:     cron.New(),
		pingURL:  pingURL,
		schedule: schedule,
	}
}

// Start begins the cron job
func (p *PingJob) Start() error {
	if p.pingURL == "" {
		log.Println("PING_URL environment variable not set, ping job will not start")
		return nil
	}

	log.Printf("Starting ping job for URL: %s with schedule: %s", p.pingURL, p.schedule)

	// Add the ping job to cron scheduler
	_, err := p.cron.AddFunc(p.schedule, p.pingEndpoint)
	if err != nil {
		return fmt.Errorf("failed to add ping job to cron: %w", err)
	}

	// Start the cron scheduler
	p.cron.Start()
	log.Println("Ping job started successfully")

	return nil
}

// Stop stops the cron job
func (p *PingJob) Stop() {
	if p.cron != nil {
		p.cron.Stop()
		log.Println("Ping job stopped")
	}
}

// pingEndpoint performs the actual ping to the URL
func (p *PingJob) pingEndpoint() {
	log.Printf("Pinging URL: %s", p.pingURL)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make the request
	resp, err := client.Get(p.pingURL)
	if err != nil {
		log.Printf("Failed to ping %s: %v", p.pingURL, err)
		return
	}
	defer resp.Body.Close()

	// Log the response status
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Successfully pinged %s - Status: %d", p.pingURL, resp.StatusCode)
	} else {
		log.Printf("Ping to %s returned non-success status: %d", p.pingURL, resp.StatusCode)
	}
}

// GetStatus returns the current status of the ping job
func (p *PingJob) GetStatus() map[string]interface{} {
	return map[string]interface{}{
		"ping_url": p.pingURL,
		"schedule": p.schedule,
		"running":  p.cron != nil,
		"next_run": p.getNextRun(),
	}
}

// getNextRun returns the next scheduled run time
func (p *PingJob) getNextRun() string {
	if p.cron == nil {
		return "Not scheduled"
	}

	entries := p.cron.Entries()
	if len(entries) == 0 {
		return "No entries"
	}

	return entries[0].Next.Format("2006-01-02 15:04:05")
}
