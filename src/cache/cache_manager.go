package cache

import (
	"os"
	"strconv"
	"sync"
	"time"
)

// Manager handles multiple named cache instances
type Manager struct {
	mu      sync.RWMutex
	caches  map[string]interface{} // stores Cache[T] instances
	configs map[string]*CacheConfig
	closed  bool
}

// Global manager instance
var (
	globalManager *Manager
	managerOnce   sync.Once
)

// GetManager returns the global cache manager instance
func GetManager() *Manager {
	managerOnce.Do(func() {
		globalManager = NewManager()
	})
	return globalManager
}

// NewManager creates a new cache manager
func NewManager() *Manager {
	return &Manager{
		caches:  make(map[string]interface{}),
		configs: make(map[string]*CacheConfig),
	}
}

// GetOrCreateCache returns a named cache instance, creating it if it doesn't exist
func GetOrCreateCache[T any](manager *Manager, name string) Cache[T] {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	if manager.closed {
		// Return a no-op cache if manager is closed
		return NewNoOpCache[T]()
	}

	if cache, exists := manager.caches[name]; exists {
		if typedCache, ok := cache.(Cache[T]); ok {
			return typedCache
		}
	}

	// Create new cache with configuration
	config := manager.getConfigForCache(name)
	cache := NewMemoryCache[T](config)
	manager.caches[name] = cache
	manager.configs[name] = config

	return cache
}

// GetCache returns a named cache instance as interface{}, creating it if it doesn't exist
func (m *Manager) GetCache(name string, cacheType interface{}) interface{} {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		// Return a no-op cache if manager is closed
		return NewNoOpCache[interface{}]()
	}

	if cache, exists := m.caches[name]; exists {
		return cache
	}

	// Create new cache with configuration based on type
	config := m.getConfigForCache(name)
	
	// Use reflection or type switching to create appropriate cache
	switch cacheType.(type) {
	case string:
		cache := NewMemoryCache[string](config)
		m.caches[name] = cache
		m.configs[name] = config
		return cache
	case int:
		cache := NewMemoryCache[int](config)
		m.caches[name] = cache
		m.configs[name] = config
		return cache
	default:
		cache := NewMemoryCache[interface{}](config)
		m.caches[name] = cache
		m.configs[name] = config
		return cache
	}
}

// SetCacheConfig sets configuration for a named cache
func (m *Manager) SetCacheConfig(name string, config *CacheConfig) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.configs[name] = config
}

// GetCacheNames returns all cache names
func (m *Manager) GetCacheNames() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.caches))
	for name := range m.caches {
		names = append(names, name)
	}
	return names
}

// GetAllMetrics returns metrics for all caches
func (m *Manager) GetAllMetrics() map[string]*Metrics {
	m.mu.RLock()
	defer m.mu.RUnlock()

	metrics := make(map[string]*Metrics)
	for name, cache := range m.caches {
		if metricProvider, ok := cache.(interface{ GetMetrics() *Metrics }); ok {
			metrics[name] = metricProvider.GetMetrics()
		}
	}
	return metrics
}

// ClearCache clears a specific named cache
func (m *Manager) ClearCache(name string) error {
	m.mu.RLock()
	cache, exists := m.caches[name]
	m.mu.RUnlock()

	if !exists {
		return nil
	}

	if clearable, ok := cache.(interface{ Clear() error }); ok {
		return clearable.Clear()
	}
	return nil
}

// ClearAll clears all caches
func (m *Manager) ClearAll() error {
	m.mu.RLock()
	caches := make([]interface{}, 0, len(m.caches))
	for _, cache := range m.caches {
		caches = append(caches, cache)
	}
	m.mu.RUnlock()

	for _, cache := range caches {
		if clearable, ok := cache.(interface{ Clear() error }); ok {
			clearable.Clear()
		}
	}
	return nil
}

// Close shuts down all caches and the manager
func (m *Manager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return
	}

	// Close all caches that support closing
	for _, cache := range m.caches {
		if closeable, ok := cache.(interface{ Close() }); ok {
			closeable.Close()
		}
	}

	m.caches = make(map[string]interface{})
	m.configs = make(map[string]*CacheConfig)
	m.closed = true
}

// getConfigForCache returns configuration for a cache, creating default if needed
func (m *Manager) getConfigForCache(name string) *CacheConfig {
	if config, exists := m.configs[name]; exists {
		return config
	}

	// Create config from environment variables
	config := ConfigFromEnv(name)
	m.configs[name] = config
	return config
}

// ConfigFromEnv creates cache configuration from environment variables
func ConfigFromEnv(cacheName string) *CacheConfig {
	config := DefaultConfig()

	// General cache settings
	if ttlStr := os.Getenv("CACHE_DEFAULT_TTL"); ttlStr != "" {
		if ttl, err := time.ParseDuration(ttlStr); err == nil {
			config.DefaultTTL = ttl
		} else if seconds, err := strconv.Atoi(ttlStr); err == nil {
			config.DefaultTTL = time.Duration(seconds) * time.Second
		}
	}

	if maxSizeStr := os.Getenv("CACHE_MAX_SIZE"); maxSizeStr != "" {
		if maxSize, err := strconv.Atoi(maxSizeStr); err == nil && maxSize > 0 {
			config.MaxSize = maxSize
		}
	}

	if cleanupIntervalStr := os.Getenv("CACHE_CLEANUP_INTERVAL"); cleanupIntervalStr != "" {
		if interval, err := time.ParseDuration(cleanupIntervalStr); err == nil {
			config.CleanupInterval = interval
		} else if seconds, err := strconv.Atoi(cleanupIntervalStr); err == nil {
			config.CleanupInterval = time.Duration(seconds) * time.Second
		}
	}

	if enableMetricsStr := os.Getenv("CACHE_ENABLE_METRICS"); enableMetricsStr != "" {
		config.EnableMetrics = enableMetricsStr == "true" || enableMetricsStr == "1"
	}

	if evictionPolicy := os.Getenv("CACHE_EVICTION_POLICY"); evictionPolicy != "" {
		config.EvictionPolicy = evictionPolicy
	}

	// Cache-specific settings (prefix with cache name)
	prefix := "CACHE_" + cacheName + "_"
	
	if ttlStr := os.Getenv(prefix + "TTL"); ttlStr != "" {
		if ttl, err := time.ParseDuration(ttlStr); err == nil {
			config.DefaultTTL = ttl
		} else if seconds, err := strconv.Atoi(ttlStr); err == nil {
			config.DefaultTTL = time.Duration(seconds) * time.Second
		}
	}

	if maxSizeStr := os.Getenv(prefix + "MAX_SIZE"); maxSizeStr != "" {
		if maxSize, err := strconv.Atoi(maxSizeStr); err == nil && maxSize > 0 {
			config.MaxSize = maxSize
		}
	}

	return config
}

// ClipboardCacheKey generates a cache key for clipboard operations
func ClipboardCacheKey(operation, identifier string) string {
	return "clipboard:" + operation + ":" + identifier
}

// NoOpCache is a cache implementation that does nothing (fallback)
type NoOpCache[T any] struct{}

func NewNoOpCache[T any]() *NoOpCache[T] {
	return &NoOpCache[T]{}
}

func (n *NoOpCache[T]) Get(key string) (T, bool) {
	var zero T
	return zero, false
}

func (n *NoOpCache[T]) Set(key string, value T, ttl time.Duration) error {
	return nil
}

func (n *NoOpCache[T]) Delete(key string) error {
	return nil
}

func (n *NoOpCache[T]) Clear() error {
	return nil
}

func (n *NoOpCache[T]) Size() int {
	return 0
}

func (n *NoOpCache[T]) Keys() []string {
	return nil
}

func (n *NoOpCache[T]) Has(key string) bool {
	return false
}

func (n *NoOpCache[T]) SetDefaultTTL(ttl time.Duration) {}

func (n *NoOpCache[T]) GetMetrics() *Metrics {
	return &Metrics{LastReset: time.Now()}
}

// Helper functions for common cache operations

// GetClipboardCache returns the clipboard cache instance
func GetClipboardCache() Cache[interface{}] {
	return GetOrCreateCache[interface{}](GetManager(), "clipboard")
}

// GetUserCache returns the user cache instance
func GetUserCache() Cache[interface{}] {
	return GetOrCreateCache[interface{}](GetManager(), "users")
}

// GetSessionCache returns the session cache instance
func GetSessionCache() Cache[interface{}] {
	return GetOrCreateCache[interface{}](GetManager(), "sessions")
}