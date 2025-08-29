package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"api21/internal/config"
	"api21/internal/cron_jobs"
	"api21/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize cron jobs manager
	cronManager := cron_jobs.NewManager()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "API21 v1.0.0",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check route
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "API21 is running",
		})
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "API21",
			"version": "v1.0.0",
			"message": "Welcome to API21!",
		})
	})

	// Cron jobs status route
	app.Get("/cron/status", func(c *fiber.Ctx) error {
		return c.JSON(cronManager.GetStatus())
	})

	// Test ping route
	app.Post("/cron/test-ping", func(c *fiber.Ctx) error {
		var req struct {
			URL string `json:"url"`
		}
		
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}
		
		if req.URL == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": "URL is required",
			})
		}
		
		if err := cron_jobs.TestPing(req.URL); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		
		return c.JSON(fiber.Map{
			"message": "Ping successful",
			"url":     req.URL,
		})
	})

	// Setup routes
	routes.SetupRoutes(app)

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
		app.Shutdown()
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
