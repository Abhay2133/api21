package main

import (
	"log"
	"os"

	"github.com/abhay2133/api21"
	"github.com/abhay2133/api21/actions"
	"github.com/abhay2133/api21/models"
	"github.com/gobuffalo/pop/v6"
)

// main is the starting point for your Buffalo application.
func main() {
	// If the command is "migrate", we run migrations and exit
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		log.Println("[db] running migrations...")
		if err := runMigrations(); err != nil {
			log.Fatalf("[db] migration failed: %s", err)
		}
		log.Println("[db] migrations completed successfully.")
		return
	}

	// Default behavior: run migrations on boot, then start the server
	log.Println("[db] auto-migrating on boot...")
	if err := runMigrations(); err != nil {
		log.Printf("[db] warning: auto-migration failed: %s", err)
	}

	app := actions.App()
	if err := app.Serve(); err != nil {
		log.Fatal(err)
	}
}

func runMigrations() error {
	migrator, err := pop.NewMigrationBox(api21.MigrationsFS(), models.DB)
	if err != nil {
		return err
	}
	return migrator.Up()
}
