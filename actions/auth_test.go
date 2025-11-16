package actions

import (
	"net/http"
)

func (as *ActionSuite) Test_LoginHandler() {

	// Should not able to get the /login route
	res := as.JSON("/auth/login").Get()
	as.Equal(http.StatusMethodNotAllowed, res.Code)

	// Should be able to `POST` in /login route
	res = as.JSON("/auth/login").Post(map[string]string{})
	as.Equal(http.StatusOK, res.Code)
}
