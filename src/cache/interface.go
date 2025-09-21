package cache
import (
	"time"
)

// Cache defines the interface for all cache implementations
type Cache[T any] interface {
	// Get retrieves a value from the cache by key
	Get(key string) (T, bool)
	
	// Set stores a value in the cache with the given key and TTL
	Set(key string, value T, ttl time.Duration) error
	
	// Delete removes a value from the cache
	Delete(key string) error
	
	// Clear removes all values from the cache
	Clear() error
	
	// Size returns the number of items in the cache
	Size() int
	
	// Keys returns all keys in the cache
	Keys() []string
	
	// Has checks if a key exists in the cache
	Has(key string) bool
	
	// SetDefaultTTL sets the default TTL for items without explicit TTL
	SetDefaultTTL(ttl time.Duration)
	
	// GetMetrics returns cache performance metrics
	GetMetrics() *Metrics
}

// Metrics holds cache performance statistics
type Metrics struct {
	Hits        int64     `json:"hits"`
	Misses      int64     `json:"misses"`
	Sets        int64     `json:"sets"`
	Deletes     int64     `json:"deletes"`
	Evictions   int64     `json:"evictions"`
	Size        int       `json:"size"`
	HitRate     float64   `json:"hit_rate"`
	LastReset   time.Time `json:"last_reset"`
	MemoryUsage int64     `json:"memory_usage_bytes"`
}

// CacheEntry represents a cached item with metadata
type CacheEntry[T any] struct {
	Value     T         `json:"value"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
	AccessAt  time.Time `json:"last_access"`
	AccessCount int64   `json:"access_count"`
}

// IsExpired checks if the cache entry has expired
func (e *CacheEntry[T]) IsExpired() bool {
	return !e.ExpiresAt.IsZero() && time.Now().After(e.ExpiresAt)
}

// Touch updates the last access time and increments access count
func (e *CacheEntry[T]) Touch() {
	e.AccessAt = time.Now()
	e.AccessCount++
}

// CacheConfig holds configuration for cache instances
type CacheConfig struct {
	DefaultTTL    time.Duration `json:"default_ttl"`
	MaxSize       int           `json:"max_size"`
	EvictionPolicy string       `json:"eviction_policy"` // "lru", "lfu", "ttl"
	CleanupInterval time.Duration `json:"cleanup_interval"`
	EnableMetrics bool          `json:"enable_metrics"`
}

// DefaultConfig returns a sensible default configuration
func DefaultConfig() *CacheConfig {
	return &CacheConfig{
		DefaultTTL:      1 * time.Hour,
		MaxSize:         1000,
		EvictionPolicy:  "lru",
		CleanupInterval: 5 * time.Minute,
		EnableMetrics:   true,
	}
}