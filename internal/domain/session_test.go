package domain_test

import (
	"testing"

	"github.com/abhay2133/api21/internal/domain"
)

func TestMaskIP(t *testing.T) {
	tests := []struct {
		name     string
		ip       string
		expected string
	}{
		{
			name:     "IPv4 localhost",
			ip:       "127.0.0.1",
			expected: "127.0.0.xxx",
		},
		{
			name:     "IPv4 public",
			ip:       "192.168.1.100",
			expected: "192.168.1.xxx",
		},
		{
			name:     "IPv4 invalid format (short)",
			ip:       "10.1",
			expected: "10.xxx",
		},
		{
			name:     "IPv6 localhost short",
			ip:       "::1",
			expected: "::xxxx",
		},
		{
			name:     "IPv6 public full",
			ip:       "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
			expected: "2001:0db8:85a3:0000:0000:8a2e:0370:xxxx",
		},
		{
			name:     "Empty IP",
			ip:       "",
			expected: "",
		},
		{
			name:     "Invalid IP string",
			ip:       "not-an-ip",
			expected: "xxx.xxx.xxx.xxx",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := domain.MaskIP(tt.ip)
			if got != tt.expected {
				t.Errorf("MaskIP(%q) = %q; want %q", tt.ip, got, tt.expected)
			}
		})
	}
}
