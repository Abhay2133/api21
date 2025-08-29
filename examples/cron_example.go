package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"api21/internal/cron_jobs"
)

// Example of how to use the cron jobs independently
func main() {
	// Set environment variables for demonstration
	os.Setenv("PING_URL", "https://httpbin.org/get")
	os.Setenv("PING_SCHEDULE", "*/1 * * * *") // Every minute

	// Create and start the cron manager
	manager := cron_jobs.NewManager()

	log.Println("Starting cron job example...")
	if err := manager.Start(); err != nil {
		log.Fatalf("Failed to start cron jobs: %v", err)
	}

	// Print status
	status := manager.GetStatus()
	log.Printf("Cron jobs status: %+v", status)

	// Test ping manually
	if err := cron_jobs.TestPing("https://httpbin.org/get"); err != nil {
		log.Printf("Manual ping failed: %v", err)
	}

	// Wait for interrupt signal
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)

	log.Println("Cron jobs are running. Press Ctrl+C to stop...")
	<-sigterm

	log.Println("Stopping cron jobs...")
	manager.Stop()
	log.Println("Example completed.")
}
