package actions

import (
	"net/http"
)

func (as *ActionSuite) Test_RedeployHandler() {
	// Test POST /api/redeploy endpoint
	res := as.JSON("/api/redeploy").Post(nil)
	as.Equal(http.StatusAccepted, res.Code)
	as.Contains(res.Body.String(), "version")
	as.Contains(res.Body.String(), "pending")
}

func (as *ActionSuite) Test_GetRedeployStatusHandler_InvalidVersion() {
	res := as.JSON("/api/redeploy/invalid").Get()
	as.Equal(http.StatusBadRequest, res.Code)
}

func (as *ActionSuite) Test_GetRedeployStatusHandler_NotFound() {
	res := as.JSON("/api/redeploy/99999").Get()
	as.Equal(http.StatusNotFound, res.Code)
}
