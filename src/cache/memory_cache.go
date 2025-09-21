package cache

import (
	"container/list"
	"runtime"
	"sync"
	"time"
	"unsafe"
)

// MemoryCache implements a thread-safe in-memory cache with LRU eviction
type MemoryCache[T any] struct {
	mu              sync.RWMutex
	data            map[string]*list.Element
	lruList         *list.List
	config          *CacheConfig
	metrics         *Metrics
	stopCleanup     chan struct{}
	cleanupDone     chan struct{}
}

// lruItem represents an item in the LRU list
type lruItem[T any] struct {
	key   string
	entry *CacheEntry[T]
}

// NewMemoryCache creates a new memory cache instance
func NewMemoryCache[T any](config *CacheConfig) *MemoryCache[T] {
	if config == nil {
		config = DefaultConfig()
	}

	cache := &MemoryCache[T]{
		data:        make(map[string]*list.Element),
		lruList:     list.New(),
		config:      config,
		metrics:     &Metrics{LastReset: time.Now()},
		stopCleanup: make(chan struct{}),
		cleanupDone: make(chan struct{}),
	}

	// Start background cleanup goroutine
	go cache.startCleanup()

	return cache
}

// Get retrieves a value from the cache by key
func (mc *MemoryCache[T]) Get(key string) (T, bool) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	var zero T

	element, exists := mc.data[key]
	if !exists {
		if mc.config.EnableMetrics {
			mc.metrics.Misses++
		}
		return zero, false
	}

	item := element.Value.(*lruItem[T])
	
	// Check if expired
	if item.entry.IsExpired() {
		mc.removeElementUnsafe(element)
		if mc.config.EnableMetrics {
			mc.metrics.Misses++
			mc.metrics.Evictions++
		}
		return zero, false
	}

	// Touch the entry and move to front (most recently used)
	item.entry.Touch()
	mc.lruList.MoveToFront(element)
	
	if mc.config.EnableMetrics {
		mc.metrics.Hits++
		mc.updateHitRate()
	}

	return item.entry.Value, true
}

// Set stores a value in the cache with the given key and TTL
func (mc *MemoryCache[T]) Set(key string, value T, ttl time.Duration) error {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	if ttl == 0 {
		ttl = mc.config.DefaultTTL
	}

	now := time.Now()
	var expiresAt time.Time
	if ttl > 0 {
		expiresAt = now.Add(ttl)
	}

	entry := &CacheEntry[T]{
		Value:       value,
		ExpiresAt:   expiresAt,
		CreatedAt:   now,
		AccessAt:    now,
		AccessCount: 1,
	}

	// Check if key already exists
	if element, exists := mc.data[key]; exists {
		// Update existing entry
		item := element.Value.(*lruItem[T])
		item.entry = entry
		mc.lruList.MoveToFront(element)
	} else {
		// Add new entry
		item := &lruItem[T]{key: key, entry: entry}
		element := mc.lruList.PushFront(item)
		mc.data[key] = element

		// Check if we need to evict
		if mc.config.MaxSize > 0 && mc.lruList.Len() > mc.config.MaxSize {
			mc.evictLRU()
		}
	}

	if mc.config.EnableMetrics {
		mc.metrics.Sets++
	}

	return nil
}

// Delete removes a value from the cache
func (mc *MemoryCache[T]) Delete(key string) error {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	if element, exists := mc.data[key]; exists {
		mc.removeElementUnsafe(element)
		if mc.config.EnableMetrics {
			mc.metrics.Deletes++
		}
	}

	return nil
}

// Clear removes all values from the cache
func (mc *MemoryCache[T]) Clear() error {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	mc.data = make(map[string]*list.Element)
	mc.lruList.Init()

	if mc.config.EnableMetrics {
		mc.metrics = &Metrics{LastReset: time.Now()}
	}

	return nil
}

// Size returns the number of items in the cache
func (mc *MemoryCache[T]) Size() int {
	mc.mu.RLock()
	defer mc.mu.RUnlock()
	return len(mc.data)
}

// Keys returns all keys in the cache
func (mc *MemoryCache[T]) Keys() []string {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	keys := make([]string, 0, len(mc.data))
	for key := range mc.data {
		keys = append(keys, key)
	}
	return keys
}

// Has checks if a key exists in the cache
func (mc *MemoryCache[T]) Has(key string) bool {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	element, exists := mc.data[key]
	if !exists {
		return false
	}

	item := element.Value.(*lruItem[T])
	return !item.entry.IsExpired()
}

// SetDefaultTTL sets the default TTL for items without explicit TTL
func (mc *MemoryCache[T]) SetDefaultTTL(ttl time.Duration) {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.config.DefaultTTL = ttl
}

// GetMetrics returns cache performance metrics
func (mc *MemoryCache[T]) GetMetrics() *Metrics {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	// Update memory usage
	if mc.config.EnableMetrics {
		mc.metrics.Size = len(mc.data)
		mc.metrics.MemoryUsage = mc.estimateMemoryUsage()
		mc.updateHitRate()
	}

	// Return a copy to avoid race conditions
	metricsCopy := *mc.metrics
	return &metricsCopy
}

// Close stops the cleanup goroutine and cleans up resources
func (mc *MemoryCache[T]) Close() {
	close(mc.stopCleanup)
	<-mc.cleanupDone
}

// removeElementUnsafe removes an element from the cache (assumes lock is held)
func (mc *MemoryCache[T]) removeElementUnsafe(element *list.Element) {
	item := element.Value.(*lruItem[T])
	delete(mc.data, item.key)
	mc.lruList.Remove(element)
}

// evictLRU removes the least recently used item
func (mc *MemoryCache[T]) evictLRU() {
	if mc.lruList.Len() == 0 {
		return
	}

	element := mc.lruList.Back()
	mc.removeElementUnsafe(element)
	
	if mc.config.EnableMetrics {
		mc.metrics.Evictions++
	}
}

// updateHitRate calculates and updates the hit rate
func (mc *MemoryCache[T]) updateHitRate() {
	total := mc.metrics.Hits + mc.metrics.Misses
	if total > 0 {
		mc.metrics.HitRate = float64(mc.metrics.Hits) / float64(total)
	}
}

// estimateMemoryUsage estimates the memory usage of the cache
func (mc *MemoryCache[T]) estimateMemoryUsage() int64 {
	if len(mc.data) == 0 {
		return 0
	}

	// Estimate memory usage based on map size and element overhead
	mapOverhead := int64(len(mc.data)) * 64 // rough estimate for map entry overhead
	listOverhead := int64(mc.lruList.Len()) * 48 // rough estimate for list element overhead
	
	// Add estimate for stored data (this is approximate)
	var sample T
	sampleSize := int64(unsafe.Sizeof(sample))
	dataSize := int64(len(mc.data)) * sampleSize

	return mapOverhead + listOverhead + dataSize
}

// startCleanup runs the background cleanup process
func (mc *MemoryCache[T]) startCleanup() {
	defer close(mc.cleanupDone)

	ticker := time.NewTicker(mc.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			mc.cleanupExpired()
		case <-mc.stopCleanup:
			return
		}
	}
}

// cleanupExpired removes expired entries from the cache
func (mc *MemoryCache[T]) cleanupExpired() {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	now := time.Now()
	var toRemove []*list.Element

	// Collect expired elements
	for element := mc.lruList.Front(); element != nil; element = element.Next() {
		item := element.Value.(*lruItem[T])
		if !item.entry.ExpiresAt.IsZero() && now.After(item.entry.ExpiresAt) {
			toRemove = append(toRemove, element)
		}
	}

	// Remove expired elements
	for _, element := range toRemove {
		mc.removeElementUnsafe(element)
		if mc.config.EnableMetrics {
			mc.metrics.Evictions++
		}
	}
}

// ForceGC manually triggers garbage collection (useful for testing memory usage)
func (mc *MemoryCache[T]) ForceGC() {
	runtime.GC()
}