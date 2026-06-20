package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/abhay2133/api21/internal/delivery/http/handler"
	"github.com/gin-gonic/gin"
)

func TestGetHealth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Inject nil connections to simulate degraded health check
	healthHandler := handler.NewHealthHandler(nil, nil)
	r.GET("/api/v1/health", healthHandler.GetHealth)

	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if response["success"] != true {
		t.Errorf("expected success to be true, got %v", response["success"])
	}

	data, ok := response["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("invalid data block in response")
	}

	if data["postgres"] != "down" {
		t.Errorf("expected postgres to be down, got %v", data["postgres"])
	}

	if data["redis"] != "down" {
		t.Errorf("expected redis to be down, got %v", data["redis"])
	}

	if data["status"] != "degraded" {
		t.Errorf("expected status to be degraded, got %v", data["status"])
	}
}
