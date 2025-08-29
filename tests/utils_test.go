package tests

import (
	"fmt"
	"testing"
	"time"

	"api21/pkg/utils"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"

	// Test successful hashing
	hashedPassword, err := utils.HashPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, hashedPassword)
	assert.NotEqual(t, password, hashedPassword)

	// Test that same password produces different hashes (due to salt)
	hashedPassword2, err := utils.HashPassword(password)
	assert.NoError(t, err)
	assert.NotEqual(t, hashedPassword, hashedPassword2)
}

func TestCheckPassword(t *testing.T) {
	password := "testpassword123"
	wrongPassword := "wrongpassword"

	// Hash the password
	hashedPassword, err := utils.HashPassword(password)
	assert.NoError(t, err)

	// Test correct password
	err = utils.CheckPassword(password, hashedPassword)
	assert.NoError(t, err)

	// Test wrong password
	err = utils.CheckPassword(wrongPassword, hashedPassword)
	assert.Error(t, err)
}

func TestGenerateRandomString(t *testing.T) {
	// Test different lengths
	lengths := []int{8, 16, 32, 64}

	for _, length := range lengths {
		t.Run(fmt.Sprintf("length_%d", length), func(t *testing.T) {
			randomStr, err := utils.GenerateRandomString(length)
			assert.NoError(t, err)
			assert.Len(t, randomStr, length)
			assert.NotEmpty(t, randomStr)
		})
	}

	// Test uniqueness
	str1, err1 := utils.GenerateRandomString(16)
	str2, err2 := utils.GenerateRandomString(16)
	assert.NoError(t, err1)
	assert.NoError(t, err2)
	assert.NotEqual(t, str1, str2)
}

func TestValidateEmail(t *testing.T) {
	testCases := []struct {
		name     string
		email    string
		expected bool
	}{
		{"Valid email", "test@example.com", true},
		{"Valid email with subdomain", "user@mail.example.com", true},
		{"Valid email with numbers", "user123@example.com", true},
		{"Valid email with dots", "user.name@example.com", true},
		{"Valid email with plus", "user+tag@example.com", true},
		{"Invalid email - no @", "testexample.com", false},
		{"Invalid email - no domain", "test@", false},
		{"Invalid email - no username", "@example.com", false},
		{"Invalid email - no TLD", "test@example", false},
		{"Invalid email - spaces", "test @example.com", false},
		{"Empty email", "", false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := utils.ValidateEmail(tc.email)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSanitizeString(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Remove HTML tags",
			input:    "<script>alert('xss')</script>Hello World",
			expected: "Hello World",
		},
		{
			name:     "Remove multiple HTML tags",
			input:    "<div><p>Hello</p> <span>World</span></div>",
			expected: "Hello World",
		},
		{
			name:     "Trim whitespace",
			input:    "  Hello World  ",
			expected: "Hello World",
		},
		{
			name:     "Clean string unchanged",
			input:    "Hello World",
			expected: "Hello World",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "Only HTML tags",
			input:    "<div></div>",
			expected: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := utils.SanitizeString(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestFormatTimestamp(t *testing.T) {
	// Test with known timestamp
	testTime := time.Date(2023, 12, 25, 15, 30, 45, 0, time.UTC)
	expected := "2023-12-25 15:30:45"

	result := utils.FormatTimestamp(testTime)
	assert.Equal(t, expected, result)

	// Test with current time (just check format)
	now := time.Now()
	result = utils.FormatTimestamp(now)
	assert.Len(t, result, 19) // Format should be "YYYY-MM-DD HH:MM:SS"
	assert.Contains(t, result, "-")
	assert.Contains(t, result, ":")
	assert.Contains(t, result, " ")
}

func TestCalculatePagination(t *testing.T) {
	testCases := []struct {
		name           string
		page           int
		limit          int
		total          int
		expectedPage   int
		expectedLimit  int
		expectedTotal  int
		expectedPages  int
		expectedOffset int
	}{
		{
			name:           "Valid pagination",
			page:           2,
			limit:          10,
			total:          50,
			expectedPage:   2,
			expectedLimit:  10,
			expectedTotal:  50,
			expectedPages:  5,
			expectedOffset: 10,
		},
		{
			name:           "First page",
			page:           1,
			limit:          10,
			total:          25,
			expectedPage:   1,
			expectedLimit:  10,
			expectedTotal:  25,
			expectedPages:  3,
			expectedOffset: 0,
		},
		{
			name:           "Invalid page (negative)",
			page:           -1,
			limit:          10,
			total:          25,
			expectedPage:   1,
			expectedLimit:  10,
			expectedTotal:  25,
			expectedPages:  3,
			expectedOffset: 0,
		},
		{
			name:           "Invalid limit (negative)",
			page:           1,
			limit:          -5,
			total:          25,
			expectedPage:   1,
			expectedLimit:  10,
			expectedTotal:  25,
			expectedPages:  3,
			expectedOffset: 0,
		},
		{
			name:           "Zero total",
			page:           1,
			limit:          10,
			total:          0,
			expectedPage:   1,
			expectedLimit:  10,
			expectedTotal:  0,
			expectedPages:  0,
			expectedOffset: 0,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := utils.CalculatePagination(tc.page, tc.limit, tc.total)

			assert.Equal(t, tc.expectedPage, result["page"])
			assert.Equal(t, tc.expectedLimit, result["limit"])
			assert.Equal(t, tc.expectedTotal, result["total"])
			assert.Equal(t, tc.expectedPages, result["total_pages"])
			assert.Equal(t, tc.expectedOffset, result["offset"])
		})
	}
}

// Benchmark tests
func BenchmarkHashPassword(b *testing.B) {
	password := "testpassword123"

	for i := 0; i < b.N; i++ {
		_, _ = utils.HashPassword(password)
	}
}

func BenchmarkCheckPassword(b *testing.B) {
	password := "testpassword123"
	hashedPassword, _ := utils.HashPassword(password)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = utils.CheckPassword(password, hashedPassword)
	}
}

func BenchmarkGenerateRandomString(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_, _ = utils.GenerateRandomString(32)
	}
}

func BenchmarkValidateEmail(b *testing.B) {
	email := "test@example.com"

	for i := 0; i < b.N; i++ {
		_ = utils.ValidateEmail(email)
	}
}

func BenchmarkSanitizeString(b *testing.B) {
	input := "<div><p>Hello</p> <span>World</span></div>"

	for i := 0; i < b.N; i++ {
		_ = utils.SanitizeString(input)
	}
}
