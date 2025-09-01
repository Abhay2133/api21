package app

import (
	"log"

	"api21/internal/config"
	"api21/internal/cron_jobs"
	"api21/internal/database"
	"api21/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

// NewApp creates a new Fiber app with the same configuration as production
func NewApp(cfg *config.Config) *fiber.App {
	// Initialize Fiber app with production config
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

	// Add all production middleware
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

	// Cron jobs status route (for tests, we'll create a minimal manager)
	cronManager := cron_jobs.NewManager()
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

	return app
}

// NewAppWithDatabase creates a new Fiber app and initializes the database connection
func NewAppWithDatabase(cfg *config.Config) *fiber.App {
	// Initialize database
	if err := database.Connect(cfg); err != nil {
		log.Printf("⚠️  Database connection failed: %v", err)
		log.Println("📝 Continuing without database - some features may not work")
	} else {
		// Run migrations
		if err := database.Migrate(); err != nil {
			log.Printf("⚠️  Database migration failed: %v", err)
		}
	}

	return NewApp(cfg)
}

// NewTestApp creates a new Fiber app for testing with minimal configuration
func NewTestApp() *fiber.App {
	cfg := &config.Config{
		Port: "3000",
		Database: config.DatabaseConfig{
			Driver: "sqlite",
		},
		CronJobs: config.CronJobsConfig{
			PingURL:      "",
			PingSchedule: "*/5 * * * *",
		},
	}
	return NewApp(cfg)
}
