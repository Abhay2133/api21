package cache

import (
	"os"
	"testing"
	"time"

	"api21/src/cache"

	"github.com/stretchr/testify/assert"
)

func TestCacheManager_BasicOperations(t *testing.T) {
	manager := cache.NewManager()
	defer manager.Close()

	t.Run("Get Cache Instance", func(t *testing.T) {
		cache1 := cache.GetOrCreateCache[string](manager, "test_cache")
		assert.NotNil(t, cache1)

		// Same cache instance should be returned
		cache2 := cache.GetOrCreateCache[string](manager, "test_cache")
		assert.Equal(t, cache1, cache2)
	})

	t.Run("Different Cache Types", func(t *testing.T) {
		stringCache := cache.GetOrCreateCache[string](manager, "string_cache")
		intCache := cache.GetOrCreateCache[int](manager, "int_cache")

		stringCache.Set("key", "value", 0)
		intCache.Set("key", 42, 0)

		strVal, found := stringCache.Get("key")
		assert.True(t, found)
		assert.Equal(t, "value", strVal)

		intVal, found := intCache.Get("key")
		assert.True(t, found)
		assert.Equal(t, 42, intVal)
	})

	t.Run("Cache Names", func(t *testing.T) {
		cache.GetOrCreateCache[string](manager, "cache1")
		cache.GetOrCreateCache[int](manager, "cache2")
		cache.GetOrCreateCache[bool](manager, "cache3")

		names := manager.GetCacheNames()
		assert.Contains(t, names, "cache1")
		assert.Contains(t, names, "cache2")
		assert.Contains(t, names, "cache3")
	})

	t.Run("Clear Specific Cache", func(t *testing.T) {
		testCache := cache.GetOrCreateCache[string](manager, "clear_test")
		testCache.Set("key1", "value1", 0)
		testCache.Set("key2", "value2", 0)

		assert.Equal(t, 2, testCache.Size())

		err := manager.ClearCache("clear_test")
		assert.NoError(t, err)
		assert.Equal(t, 0, testCache.Size())
	})

	t.Run("Clear All Caches", func(t *testing.T) {
		cache1 := cache.GetOrCreateCache[string](manager, "clear_all_1")
		cache2 := cache.GetOrCreateCache[int](manager, "clear_all_2")

		cache1.Set("key", "value", 0)
		cache2.Set("key", 42, 0)

		assert.Equal(t, 1, cache1.Size())
		assert.Equal(t, 1, cache2.Size())

		err := manager.ClearAll()
		assert.NoError(t, err)

		assert.Equal(t, 0, cache1.Size())
		assert.Equal(t, 0, cache2.Size())
	})

	t.Run("Get All Metrics", func(t *testing.T) {
		cache1 := cache.GetOrCreateCache[string](manager, "metrics_1")
		cache2 := cache.GetOrCreateCache[string](manager, "metrics_2")

		cache1.Set("key", "value", 0)
		cache1.Get("key")
		cache2.Set("key", "value", 0)
		cache2.Get("missing")

		metrics := manager.GetAllMetrics()
		assert.Contains(t, metrics, "metrics_1")
		assert.Contains(t, metrics, "metrics_2")

		assert.Equal(t, int64(1), metrics["metrics_1"].Hits)
		assert.Equal(t, int64(1), metrics["metrics_2"].Misses)
	})
}

func TestCacheManager_ConfigFromEnv(t *testing.T) {
	// Save original env vars
	originalVars := map[string]string{
		"CACHE_DEFAULT_TTL":      os.Getenv("CACHE_DEFAULT_TTL"),
		"CACHE_MAX_SIZE":         os.Getenv("CACHE_MAX_SIZE"),
		"CACHE_CLEANUP_INTERVAL": os.Getenv("CACHE_CLEANUP_INTERVAL"),
		"CACHE_ENABLE_METRICS":   os.Getenv("CACHE_ENABLE_METRICS"),
		"CACHE_TEST_TTL":         os.Getenv("CACHE_TEST_TTL"),
		"CACHE_TEST_MAX_SIZE":    os.Getenv("CACHE_TEST_MAX_SIZE"),
	}

	// Restore original env vars after test
	defer func() {
		for key, value := range originalVars {
			if value == "" {
				os.Unsetenv(key)
			} else {
				os.Setenv(key, value)
			}
		}
	}()

	t.Run("Default Configuration", func(t *testing.T) {
		// Clear env vars
		os.Unsetenv("CACHE_DEFAULT_TTL")
		os.Unsetenv("CACHE_MAX_SIZE")
		os.Unsetenv("CACHE_CLEANUP_INTERVAL")
		os.Unsetenv("CACHE_ENABLE_METRICS")

		config := cache.ConfigFromEnv("test")
		assert.Equal(t, 1*time.Hour, config.DefaultTTL)
		assert.Equal(t, 1000, config.MaxSize)
		assert.Equal(t, 5*time.Minute, config.CleanupInterval)
		assert.True(t, config.EnableMetrics)
	})

	t.Run("Global Environment Configuration", func(t *testing.T) {
		os.Setenv("CACHE_DEFAULT_TTL", "3600")        // 1 hour in seconds
		os.Setenv("CACHE_MAX_SIZE", "500")
		os.Setenv("CACHE_CLEANUP_INTERVAL", "300")    // 5 minutes in seconds
		os.Setenv("CACHE_ENABLE_METRICS", "false")

		config := cache.ConfigFromEnv("test")
		assert.Equal(t, 1*time.Hour, config.DefaultTTL)
		assert.Equal(t, 500, config.MaxSize)
		assert.Equal(t, 5*time.Minute, config.CleanupInterval)
		assert.False(t, config.EnableMetrics)
	})

	t.Run("Cache-Specific Configuration", func(t *testing.T) {
		os.Setenv("CACHE_DEFAULT_TTL", "3600")
		os.Setenv("CACHE_MAX_SIZE", "1000")
		os.Setenv("CACHE_TEST_TTL", "1800")          // Cache-specific override
		os.Setenv("CACHE_TEST_MAX_SIZE", "200")      // Cache-specific override

		config := cache.ConfigFromEnv("TEST")
		assert.Equal(t, 30*time.Minute, config.DefaultTTL) // 1800 seconds
		assert.Equal(t, 200, config.MaxSize)                // Cache-specific value
	})

	t.Run("Duration Parsing", func(t *testing.T) {
		os.Setenv("CACHE_DEFAULT_TTL", "2h30m")
		os.Setenv("CACHE_CLEANUP_INTERVAL", "10m")

		config := cache.ConfigFromEnv("test")
		assert.Equal(t, 2*time.Hour+30*time.Minute, config.DefaultTTL)
		assert.Equal(t, 10*time.Minute, config.CleanupInterval)
	})
}

func TestCacheManager_GlobalInstance(t *testing.T) {
	// Test that GetManager returns the same instance
	manager1 := cache.GetManager()
	manager2 := cache.GetManager()
	assert.Equal(t, manager1, manager2)

	// Test helper functions
	clipboardCache := cache.GetClipboardCache()
	assert.NotNil(t, clipboardCache)

	userCache := cache.GetUserCache()
	assert.NotNil(t, userCache)

	sessionCache := cache.GetSessionCache()
	assert.NotNil(t, sessionCache)

	// These should be different cache instances
	assert.NotEqual(t, clipboardCache, userCache)
	assert.NotEqual(t, userCache, sessionCache)
}

func TestCacheManager_ClosedState(t *testing.T) {
	manager := cache.NewManager()

	// Create a cache
	testCache := cache.GetOrCreateCache[string](manager, "test")
	testCache.Set("key", "value", 0)

	// Close the manager
	manager.Close()

	// Getting cache after close should return no-op cache
	newCache := cache.GetOrCreateCache[string](manager, "new_cache")
	newCache.Set("key", "value", 0)
	
	// No-op cache should always return false for Get
	_, found := newCache.Get("key")
	assert.False(t, found)
	assert.Equal(t, 0, newCache.Size())
}

func TestNoOpCache(t *testing.T) {
	cache := cache.NewNoOpCache[string]()

	// All operations should be no-ops
	err := cache.Set("key", "value", time.Hour)
	assert.NoError(t, err)

	_, found := cache.Get("key")
	assert.False(t, found)

	assert.False(t, cache.Has("key"))
	assert.Equal(t, 0, cache.Size())
	assert.Empty(t, cache.Keys())

	err = cache.Delete("key")
	assert.NoError(t, err)

	err = cache.Clear()
	assert.NoError(t, err)

	cache.SetDefaultTTL(time.Hour) // Should not panic

	metrics := cache.GetMetrics()
	assert.NotNil(t, metrics)
	assert.Equal(t, int64(0), metrics.Hits)
}

func TestClipboardCacheKey(t *testing.T) {
	key1 := cache.ClipboardCacheKey("get", "title123")
	assert.Equal(t, "clipboard:get:title123", key1)

	key2 := cache.ClipboardCacheKey("list", "all")
	assert.Equal(t, "clipboard:list:all", key2)

	// Different operations should produce different keys
	assert.NotEqual(t, key1, key2)
}