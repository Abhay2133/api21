package actions

import (
	"github.com/gobuffalo/buffalo"
)

func setupRoutes(app *buffalo.App) {
	// Home Route
	app.GET("/", HomeHandler)

	// Auth Routes
	app.POST("/auth/login", LoginHandler)
}