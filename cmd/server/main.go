package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"api21/internal/app"
	"api21/internal/config"
	"api21/internal/cron_jobs"
	"api21/internal/database"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Create app with database connection
	fiberApp := app.NewAppWithDatabase(cfg)

	// Initialize cron jobs manager
	cronManager := cron_jobs.NewManager()

	// Start cron jobs
	if err := cronManager.Start(); err != nil {
		log.Fatalf("Failed to start cron jobs: %v", err)
	}

	// Setup graceful shutdown
	go func() {
		sigterm := make(chan os.Signal, 1)
		signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)
		<-sigterm
		log.Println("Shutting down server...")
		cronManager.Stop()

		// Close database connection
		if err := database.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}

		fiberApp.Shutdown()
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := fiberApp.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
