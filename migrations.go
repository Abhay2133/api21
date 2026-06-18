package api21

import (
	"embed"
	"io/fs"

	"github.com/gobuffalo/buffalo"
)

//go:embed migrations/*.fizz
var files embed.FS

// MigrationsFS returns the embedded migration files
func MigrationsFS() fs.FS {
	return buffalo.NewFS(files, "migrations")
}
