package actions

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"testing"
)

// Test_WebhookHandler_ExtractBranchFromRef tests branch extraction
func TestExtractBranchFromRef(t *testing.T) {
	tests := []struct {
		ref      string
		expected string
	}{
		{"refs/heads/main", "main"},
		{"refs/heads/master", "master"},
		{"refs/heads/develop", "develop"},
		{"refs/heads/feature/my-feature", "feature/my-feature"},
		{"main", "main"},
		{"master", "master"},
		{"", ""},
		{"refs/tags/v1.0.0", "refs/tags/v1.0.0"}, // Not a branch ref
	}

	for _, test := range tests {
		result := extractBranchFromRef(test.ref)
		if result != test.expected {
			t.Errorf("extractBranchFromRef(%q) = %q, want %q", test.ref, result, test.expected)
		}
	}
}

// Test_VerifyWebhookSignature tests signature verification
func TestVerifyWebhookSignature(t *testing.T) {
	secret := "test-secret"
	body := []byte(`{"action":"opened"}`)

	// Create valid signature
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	validSignature := "sha256=" + hex.EncodeToString(h.Sum(nil))

	tests := []struct {
		name      string
		body      []byte
		signature string
		secret    string
		expected  bool
	}{
		{
			name:      "Valid signature",
			body:      body,
			signature: validSignature,
			secret:    secret,
			expected:  true,
		},
		{
			name:      "Invalid signature",
			body:      body,
			signature: "sha256=invalid",
			secret:    secret,
			expected:  false,
		},
		{
			name:      "Empty signature",
			body:      body,
			signature: "",
			secret:    secret,
			expected:  false,
		},
		{
			name:      "Wrong secret",
			body:      body,
			signature: validSignature,
			secret:    "wrong-secret",
			expected:  false,
		},
		{
			name:      "Different body",
			body:      []byte(`{"action":"closed"}`),
			signature: validSignature,
			secret:    secret,
			expected:  false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := verifyWebhookSignature(test.body, test.signature, test.secret)
			if result != test.expected {
				t.Errorf("verifyWebhookSignature() = %v, want %v", result, test.expected)
			}
		})
	}
}

// Integration tests with ActionSuite are not included because the buffalo test suite
// does not provide an easy way to set custom headers like X-GitHub-Event in as.JSON().Post().
//
// The webhook endpoint is best tested through:
// 1. Unit tests above (TestExtractBranchFromRef, TestVerifyWebhookSignature)
// 2. Manual testing with curl and the provided fixtures
// 3. Actual GitHub webhook deliveries
//
// To test locally:
//   buffalo dev
//   curl -X POST http://localhost:5000/webhooks/github \
//     -H "X-GitHub-Event: pull_request" \
//     -H "Content-Type: application/json" \
//     -d @fixtures/webhook-pr-merged-payload.json
//
// Unit tests demonstrate:
// - Branch name extraction from git refs
// - HMAC-SHA256 signature verification with multiple scenarios

// Test_WebhookHandler_MissingHeader tests handler with missing event header
// NOTE: This test shows the endpoint returns 400 when header is missing
func (as *ActionSuite) Test_WebhookHandler_MissingHeader() {
	payload := map[string]interface{}{
		"action": "opened",
	}

	body, err := json.Marshal(payload)
	as.NoError(err)

	res := as.JSON("/webhooks/github").Post(body)

	as.Equal(http.StatusBadRequest, res.Code)
	as.Contains(res.Body.String(), "Missing X-GitHub-Event header")
}

// Helper function to create string pointer
func ptrStr(s string) *string {
	return &s
}
