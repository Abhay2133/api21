package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"api21/src"
	"api21/src/cache"
	"api21/src/config"
	"api21/src/migrations"
	"api21/src/routes"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("[MAIN] No .env file found or error loading .env file:", err)
		log.Println("[MAIN] Continuing with system environment variables...")
	} else {
		log.Println("[MAIN] Environment variables loaded from .env file")
	}

	// Initialize database
	config.InitDatabase()
	log.Println("[MAIN] Database initialized")

	// Run database migrations
	db := config.GetDB()
	if err := migrations.RunMigrations(db); err != nil {
		// If we're running in development (no DATABASE_URL) try a safe recovery:
		// close the SQLite DB file, remove it, reinitialize and re-run migrations.
		if os.Getenv("DATABASE_URL") == "" {
			log.Printf("[MAIN] Migration error in development: %v", err)
			log.Println("[MAIN] Attempting safe dev recovery: recreating local SQLite DB and re-running migrations")

			// Close DB connection so file can be removed
			config.CloseDatabase()

			// Remove the sqlite file (dev only)
			sqlitePath := "./tmp/api21.db"
			if removeErr := os.Remove(sqlitePath); removeErr != nil {
				log.Printf("[MAIN] Warning: failed to remove sqlite file %s: %v", sqlitePath, removeErr)
			} else {
				log.Printf("[MAIN] Removed sqlite file %s", sqlitePath)
			}

			// Reinitialize database and re-run migrations
			config.InitDatabase()
			if err2 := migrations.RunMigrations(config.GetDB()); err2 != nil {
				log.Fatalf("[MAIN] Failed to run database migrations after recovery: %v", err2)
			}
			log.Println("[MAIN] Database migrations completed after recovery")
		} else {
			log.Fatalf("[MAIN] Failed to run database migrations: %v", err)
		}
	} else {
		log.Println("[MAIN] Database migrations completed")
	}

	// Initialize cron jobs
	cronScheduler := src.RegisterCronJobs()
	log.Println("[MAIN] Cron scheduler initialized")

	// Create new Fiber instance
	app := fiber.New(fiber.Config{
		AppName: "API21 v1.0.0",
	})

	// Setup middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Serve static files from public directory
	app.Static("/", "./public")

	// Setup routes
	routes.SetupRoutes(app)

	// Channel to listen for interrupt signal to terminate server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		log.Println("[MAIN] Starting Fiber server on port 3000...")
		if err := app.Listen(":3000"); err != nil {
			log.Printf("[MAIN] Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with a timeout of 10 seconds
	<-quit
	log.Println("[MAIN] Shutting down server...")

	// Create context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown cron scheduler
	log.Println("[MAIN] Stopping cron scheduler...")
	cronScheduler.Stop()

	// Close cache manager
	log.Println("[MAIN] Closing cache manager...")
	cache.GetManager().Close()

	// Close database connection
	log.Println("[MAIN] Closing database connection...")
	config.CloseDatabase()

	// Shutdown Fiber server
	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Printf("[MAIN] Server forced to shutdown: %v", err)
	} else {
		log.Println("[MAIN] Server exited gracefully")
	}

	log.Println("[MAIN] Application stopped")
}
