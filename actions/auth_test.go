package actions

import (
	"testing"
)

func Test_ConstantTimeCompare_ValidToken(t *testing.T) {
	result := constantTimeCompare("test-token", "test-token")
	if !result {
		t.Error("constantTimeCompare should return true for matching tokens")
	}
}

func Test_ConstantTimeCompare_InvalidToken(t *testing.T) {
	result := constantTimeCompare("test-token", "wrong-token")
	if result {
		t.Error("constantTimeCompare should return false for non-matching tokens")
	}
}

func Test_ConstantTimeCompare_DifferentLength(t *testing.T) {
	result := constantTimeCompare("short", "much-longer-token")
	if result {
		t.Error("constantTimeCompare should return false for different lengths")
	}
}

func Test_ConstantTimeCompare_Empty(t *testing.T) {
	result := constantTimeCompare("", "")
	if !result {
		t.Error("constantTimeCompare should return true for empty strings")
	}
}

func Test_ConstantTimeCompare(t *testing.T) {
	tests := []struct {
		name     string
		a        string
		b        string
		expected bool
	}{
		{"identical strings", "hello", "hello", true},
		{"different strings", "hello", "world", false},
		{"different lengths", "hello", "hi", false},
		{"empty strings", "", "", true},
		{"one empty", "hello", "", false},
		{"special chars", "!@#$%", "!@#$%", true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := constantTimeCompare(test.a, test.b)
			if result != test.expected {
				t.Errorf("constantTimeCompare(%q, %q) = %v, want %v", test.a, test.b, result, test.expected)
			}
		})
	}
}
