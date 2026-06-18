package models

import (
	"os"
	"testing"

	"github.com/abhay2133/api21"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/suite/v4"
)

type ModelSuite struct {
	*suite.Model
}

func Test_ModelSuite(t *testing.T) {
	os.Remove("/tmp/test.sqlite3")
	model, err := suite.NewModelWithFixtures(os.DirFS("../fixtures"))
	if err != nil {
		t.Fatal(err)
	}

	// Run migrations programmatically for test DB
	migrator, err := pop.NewMigrationBox(api21.MigrationsFS(), DB)
	if err != nil {
		t.Fatal(err)
	}
	if err := migrator.Up(); err != nil {
		t.Fatal(err)
	}

	as := &ModelSuite{
		Model: model,
	}
	suite.Run(t, as)
}
