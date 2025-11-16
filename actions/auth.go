package actions

import (
	"github.com/gobuffalo/buffalo"
	"net/http"
)


func LoginHandler(c buffalo.Context) error {

	// 1. Get credentials from JSON payload
	
	// 2. Validates them
	// 3. identify the client type using the `X-Client-Type`, defualt to `web`.
	// 4. Send the response with `access` and `refresh` token accordingly

	return c.Render(http.StatusOK, r.JSON(map[string]string{"auth": "success"}))
}
