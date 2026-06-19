package main

import (
	"log"
	"os"

	"github.com/abhay2133/api21/actions"
	"github.com/abhay2133/api21/models"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("[main] info: no .env file found, using system environment variables")
	}

	// Initialize database (GORM)
	models.InitDB()

	// If command line argument is "migrate", we just auto-migrate and exit
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		log.Println("[db] running auto-migration...")
		if err := runMigrations(); err != nil {
			log.Fatalf("[db] migration failed: %s", err)
		}
		log.Println("[db] migration completed successfully.")
		return
	}

	// Otherwise, run migration on boot and start server
	log.Println("[db] running auto-migration on boot...")
	if err := runMigrations(); err != nil {
		log.Printf("[db] warning: auto-migration on boot failed: %s", err)
	}

	// Setup and run Gin server
	r := actions.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("[main] starting Gin server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[main] server run failed: %s", err)
	}
}

func runMigrations() error {
	return models.DB.AutoMigrate(&models.User{})
}
