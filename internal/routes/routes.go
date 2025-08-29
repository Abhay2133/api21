package routes

import (
	"api21/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// API v1 group
	api := app.Group("/api/v1")

	// User routes
	users := api.Group("/users")
	users.Get("/", handlers.GetUsers)
	users.Get("/:id", handlers.GetUser)
	users.Post("/", handlers.CreateUser)
	users.Put("/:id", handlers.UpdateUser)
	users.Delete("/:id", handlers.DeleteUser)

	// Example resource routes
	items := api.Group("/items")
	items.Get("/", handlers.GetItems)
	items.Get("/:id", handlers.GetItem)
	items.Post("/", handlers.CreateItem)
	items.Put("/:id", handlers.UpdateItem)
	items.Delete("/:id", handlers.DeleteItem)
}
