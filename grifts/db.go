package grifts

import (
	"fmt"

	"github.com/gobuffalo/grift/grift"
	"github.com/gobuffalo/pop/v6"
)

var _ = grift.Namespace("db", func() {

	grift.Desc("migrate", "Run pending migrations")
	grift.Add("migrate", func(c *grift.Context) error {
		conn, err := pop.Connect("development")
		if err != nil {
			return fmt.Errorf("failed to connect to database: %w", err)
		}
		defer conn.Close()

		// Run migrations using the migrator
		m, err := pop.NewFileMigrator(".", conn)
		if err != nil {
			return fmt.Errorf("failed to create migrator: %w", err)
		}

		err = m.Up()
		if err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}

		fmt.Println("Migrations completed successfully")
		return nil
	})

	grift.Desc("seed", "Seeds a database")
	grift.Add("seed", func(c *grift.Context) error {
		// Add DB seeding stuff here
		return nil
	})

})
