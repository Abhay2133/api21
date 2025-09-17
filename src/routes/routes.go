package routes

import (
	"github.com/gofiber/fiber/v2"

	"api21/src/controllers"
)

// SetupRoutes configures all application routes
func SetupRoutes(app *fiber.App) {
	// Create controller instances
	userController := controllers.NewUserController()
	clipboardController := controllers.NewClipboardController()

	// API routes group
	api := app.Group("/api")

	// Health check endpoint
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success": true,
			"message": "API is healthy",
			"service": "api21",
			"version": "1.0.0",
		})
	})

	// User routes group
	userRoutes := api.Group("/users")
	userRoutes.Get("/", userController.GetUsers)         // GET /api/users
	userRoutes.Get("/:id", userController.GetUser)       // GET /api/users/:id
	userRoutes.Post("/", userController.CreateUser)      // POST /api/users
	userRoutes.Put("/:id", userController.UpdateUser)    // PUT /api/users/:id
	userRoutes.Delete("/:id", userController.DeleteUser) // DELETE /api/users/:id

	// Clipboard routes group
	clipboardRoutes := api.Group("/clipboard")
	clipboardRoutes.Get("/", clipboardController.GetClipboards)                   // GET /api/clipboard
	clipboardRoutes.Get("/:id", clipboardController.GetClipboard)                 // GET /api/clipboard/:id
	clipboardRoutes.Get("/title/:title", clipboardController.GetClipboardByTitle) // GET /api/clipboard/title/:title
	clipboardRoutes.Post("/", clipboardController.CreateClipboard)                // POST /api/clipboard
	clipboardRoutes.Put("/:id", clipboardController.UpdateClipboard)              // PUT /api/clipboard/:id
	clipboardRoutes.Delete("/:id", clipboardController.DeleteClipboard)           // DELETE /api/clipboard/:id

	// Root route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success": true,
			"message": "Welcome to API21",
			"version": "1.0.0",
			"endpoints": fiber.Map{
				"health":             "/api/health",
				"users":              "/api/users",
				"user_by_id":         "/api/users/:id",
				"clipboard":          "/api/clipboard",
				"clipboard_by_id":    "/api/clipboard/:id",
				"clipboard_by_title": "/api/clipboard/title/:title",
			},
		})
	})
}
