package actions

import (
	"os"
	"testing"

	"github.com/abhay2133/api21"
	"github.com/abhay2133/api21/models"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/suite/v4"
)

type ActionSuite struct {
	*suite.Action
}

func Test_ActionSuite(t *testing.T) {
	os.Remove("/tmp/test.sqlite3")
	action, err := suite.NewActionWithFixtures(App(), os.DirFS("../fixtures"))
	if err != nil {
		t.Fatal(err)
	}

	// Run migrations programmatically for test DB
	migrator, err := pop.NewMigrationBox(api21.MigrationsFS(), models.DB)
	if err != nil {
		t.Fatal(err)
	}
	if err := migrator.Up(); err != nil {
		t.Fatal(err)
	}

	as := &ActionSuite{
		Action: action,
	}
	suite.Run(t, as)
}
