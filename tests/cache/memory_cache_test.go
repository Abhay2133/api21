package cache

import (
	"fmt"
	"testing"
	"time"

	"api21/src/cache"

	"github.com/stretchr/testify/assert"
)

func TestMemoryCache_BasicOperations(t *testing.T) {
	config := &cache.CacheConfig{
		DefaultTTL:      1 * time.Hour,
		MaxSize:         100,
		EvictionPolicy:  "lru",
		CleanupInterval: 1 * time.Minute,
		EnableMetrics:   true,
	}

	c := cache.NewMemoryCache[string](config)
	defer c.Close()

	t.Run("Set and Get", func(t *testing.T) {
		err := c.Set("key1", "value1", 0)
		assert.NoError(t, err)

		value, found := c.Get("key1")
		assert.True(t, found)
		assert.Equal(t, "value1", value)
	})

	t.Run("Get non-existent key", func(t *testing.T) {
		value, found := c.Get("non-existent")
		assert.False(t, found)
		assert.Equal(t, "", value)
	})

	t.Run("Update existing key", func(t *testing.T) {
		err := c.Set("key1", "updated_value", 0)
		assert.NoError(t, err)

		value, found := c.Get("key1")
		assert.True(t, found)
		assert.Equal(t, "updated_value", value)
	})

	t.Run("Delete key", func(t *testing.T) {
		err := c.Delete("key1")
		assert.NoError(t, err)

		_, found := c.Get("key1")
		assert.False(t, found)
	})

	t.Run("Size and Keys", func(t *testing.T) {
		c.Clear()
		assert.Equal(t, 0, c.Size())

		c.Set("a", "1", 0)
		c.Set("b", "2", 0)
		c.Set("c", "3", 0)

		assert.Equal(t, 3, c.Size())
		
		keys := c.Keys()
		assert.Len(t, keys, 3)
		assert.Contains(t, keys, "a")
		assert.Contains(t, keys, "b")
		assert.Contains(t, keys, "c")
	})

	t.Run("Has method", func(t *testing.T) {
		c.Clear()
		assert.False(t, c.Has("test"))

		c.Set("test", "value", 0)
		assert.True(t, c.Has("test"))

		c.Delete("test")
		assert.False(t, c.Has("test"))
	})
}

func TestMemoryCache_TTL(t *testing.T) {
	config := &cache.CacheConfig{
		DefaultTTL:      100 * time.Millisecond,
		MaxSize:         100,
		EvictionPolicy:  "lru",
		CleanupInterval: 50 * time.Millisecond,
		EnableMetrics:   true,
	}

	c := cache.NewMemoryCache[string](config)
	defer c.Close()

	t.Run("Expiration", func(t *testing.T) {
		// Set with custom TTL
		err := c.Set("temp_key", "temp_value", 50*time.Millisecond)
		assert.NoError(t, err)

		// Should exist immediately
		value, found := c.Get("temp_key")
		assert.True(t, found)
		assert.Equal(t, "temp_value", value)

		// Wait for expiration
		time.Sleep(100 * time.Millisecond)

		// Should be expired
		_, found = c.Get("temp_key")
		assert.False(t, found)
	})

	t.Run("Default TTL", func(t *testing.T) {
		c.SetDefaultTTL(30 * time.Millisecond)
		
		err := c.Set("default_ttl_key", "value", 0)
		assert.NoError(t, err)

		time.Sleep(50 * time.Millisecond)
		
		_, found := c.Get("default_ttl_key")
		assert.False(t, found)
	})
}

func TestMemoryCache_LRUEviction(t *testing.T) {
	config := &cache.CacheConfig{
		DefaultTTL:      1 * time.Hour,
		MaxSize:         3, // Small size to trigger eviction
		EvictionPolicy:  "lru",
		CleanupInterval: 1 * time.Hour, // Long cleanup interval
		EnableMetrics:   true,
	}

	c := cache.NewMemoryCache[string](config)
	defer c.Close()

	// Fill cache to capacity
	c.Set("key1", "value1", 0)
	c.Set("key2", "value2", 0)
	c.Set("key3", "value3", 0)

	assert.Equal(t, 3, c.Size())

	// Access key1 to make it recently used
	c.Get("key1")

	// Add another item, should evict key2 (least recently used)
	c.Set("key4", "value4", 0)

	assert.Equal(t, 3, c.Size())
	assert.True(t, c.Has("key1"))  // Recently accessed
	assert.False(t, c.Has("key2")) // Should be evicted
	assert.True(t, c.Has("key3"))
	assert.True(t, c.Has("key4"))
}

func TestMemoryCache_Metrics(t *testing.T) {
	config := &cache.CacheConfig{
		DefaultTTL:      1 * time.Hour,
		MaxSize:         100,
		EvictionPolicy:  "lru",
		CleanupInterval: 1 * time.Hour,
		EnableMetrics:   true,
	}

	c := cache.NewMemoryCache[string](config)
	defer c.Close()

	// Test hits and misses
	c.Set("key1", "value1", 0)
	c.Get("key1")    // hit
	c.Get("missing") // miss
	c.Set("key2", "value2", 0)
	c.Delete("key1")

	metrics := c.GetMetrics()
	assert.Equal(t, int64(1), metrics.Hits)
	assert.Equal(t, int64(1), metrics.Misses)
	assert.Equal(t, int64(2), metrics.Sets)
	assert.Equal(t, int64(1), metrics.Deletes)
	assert.Equal(t, 1, metrics.Size)
	assert.Equal(t, 0.5, metrics.HitRate) // 1 hit / (1 hit + 1 miss)
}

func TestMemoryCache_ConcurrentAccess(t *testing.T) {
	config := &cache.CacheConfig{
		DefaultTTL:      1 * time.Hour,
		MaxSize:         1000,
		EvictionPolicy:  "lru",
		CleanupInterval: 1 * time.Hour,
		EnableMetrics:   true,
	}

	c := cache.NewMemoryCache[int](config)
	defer c.Close()

	// Test concurrent writes and reads
	done := make(chan bool, 20)

	// Start 10 writers
	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				key := fmt.Sprintf("key_%d_%d", id, j)
				c.Set(key, id*100+j, 0)
			}
			done <- true
		}(i)
	}

	// Start 10 readers
	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				key := fmt.Sprintf("key_%d_%d", id, j)
				c.Get(key)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < 20; i++ {
		<-done
	}

	// Cache should contain all written values
	assert.Equal(t, 1000, c.Size())
}

func TestMemoryCache_Clear(t *testing.T) {
	config := cache.DefaultConfig()
	c := cache.NewMemoryCache[string](config)
	defer c.Close()

	c.Set("key1", "value1", 0)
	c.Set("key2", "value2", 0)
	c.Set("key3", "value3", 0)

	assert.Equal(t, 3, c.Size())

	err := c.Clear()
	assert.NoError(t, err)
	assert.Equal(t, 0, c.Size())

	// Verify keys are gone
	_, found := c.Get("key1")
	assert.False(t, found)
}