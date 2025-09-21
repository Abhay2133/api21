package models

import (
	"fmt"
	"time"

	"api21/src/cache"
)

// CachedClipboardService provides cached access to clipboard operations
type CachedClipboardService struct {
	cache cache.Cache[interface{}]
}

// NewCachedClipboardService creates a new cached clipboard service
func NewCachedClipboardService() *CachedClipboardService {
	return &CachedClipboardService{
		cache: cache.GetClipboardCache(),
	}
}

// Default cache TTL for clipboard operations
const (
	DefaultClipboardTTL = 30 * time.Minute
	ClipboardListTTL    = 5 * time.Minute
)

// GetAllClipboardsCached retrieves all clipboard entries with caching
func (s *CachedClipboardService) GetAllClipboards() ([]Clipboard, error) {
	cacheKey := cache.ClipboardCacheKey("list", "all")
	
	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if clipboards, ok := cached.([]Clipboard); ok {
			return clipboards, nil
		}
	}

	// Cache miss - get from database
	clipboards, err := GetAllClipboards()
	if err != nil {
		return nil, err
	}

	// Store in cache
	s.cache.Set(cacheKey, clipboards, ClipboardListTTL)
	
	return clipboards, nil
}

// GetClipboardByIDCached retrieves a clipboard entry by ID with caching
func (s *CachedClipboardService) GetClipboardByID(id uint) (*Clipboard, error) {
	cacheKey := cache.ClipboardCacheKey("id", fmt.Sprintf("%d", id))
	
	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if clipboard, ok := cached.(*Clipboard); ok {
			return clipboard, nil
		}
	}

	// Cache miss - get from database
	clipboard, err := GetClipboardByID(id)
	if err != nil {
		return nil, err
	}

	// Store in cache
	s.cache.Set(cacheKey, clipboard, DefaultClipboardTTL)
	
	return clipboard, nil
}

// GetClipboardByTitleCached retrieves a clipboard entry by title with caching
func (s *CachedClipboardService) GetClipboardByTitle(title string) (*Clipboard, error) {
	cacheKey := cache.ClipboardCacheKey("title", title)
	
	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if clipboard, ok := cached.(*Clipboard); ok {
			return clipboard, nil
		}
	}

	// Cache miss - get from database
	clipboard, err := GetClipboardByTitle(title)
	if err != nil {
		return nil, err
	}

	// Store in cache
	s.cache.Set(cacheKey, clipboard, DefaultClipboardTTL)
	
	return clipboard, nil
}

// GetClipboardContentByTitleCached retrieves only the content by title with caching
// This is optimized for the /raw/:title endpoint
func (s *CachedClipboardService) GetClipboardContentByTitle(title string) (string, error) {
	cacheKey := cache.ClipboardCacheKey("content", title)
	
	// Try to get from cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if content, ok := cached.(string); ok {
			return content, nil
		}
	}

	// Cache miss - get from database
	clipboard, err := GetClipboardByTitle(title)
	if err != nil {
		return "", err
	}

	// Store only content in cache for faster access
	s.cache.Set(cacheKey, clipboard.Content, DefaultClipboardTTL)
	
	return clipboard.Content, nil
}

// CreateClipboardCached creates a new clipboard entry and invalidates relevant caches
func (s *CachedClipboardService) CreateClipboard(clipboard *Clipboard) error {
	err := clipboard.CreateClipboard()
	if err != nil {
		return err
	}

	// Invalidate list cache since a new item was added
	s.invalidateListCache()
	
	// Cache the new clipboard entry
	if clipboard.Title != "" {
		cacheKey := cache.ClipboardCacheKey("title", clipboard.Title)
		s.cache.Set(cacheKey, clipboard, DefaultClipboardTTL)
		
		contentCacheKey := cache.ClipboardCacheKey("content", clipboard.Title)
		s.cache.Set(contentCacheKey, clipboard.Content, DefaultClipboardTTL)
	}
	
	return nil
}

// UpdateClipboardCached updates an existing clipboard entry and invalidates relevant caches
func (s *CachedClipboardService) UpdateClipboard(clipboard *Clipboard) error {
	// Get the old clipboard to know what to invalidate
	oldClipboard, _ := GetClipboardByID(clipboard.ID)
	
	err := clipboard.UpdateClipboard()
	if err != nil {
		return err
	}

	// Invalidate caches
	s.invalidateListCache()
	
	// Invalidate old title cache if title changed
	if oldClipboard != nil && oldClipboard.Title != clipboard.Title {
		oldTitleKey := cache.ClipboardCacheKey("title", oldClipboard.Title)
		s.cache.Delete(oldTitleKey)
		
		oldContentKey := cache.ClipboardCacheKey("content", oldClipboard.Title)
		s.cache.Delete(oldContentKey)
	}
	
	// Update cache with new data
	if clipboard.Title != "" {
		titleCacheKey := cache.ClipboardCacheKey("title", clipboard.Title)
		s.cache.Set(titleCacheKey, clipboard, DefaultClipboardTTL)
		
		contentCacheKey := cache.ClipboardCacheKey("content", clipboard.Title)
		s.cache.Set(contentCacheKey, clipboard.Content, DefaultClipboardTTL)
	}
	
	// Invalidate ID cache
	idCacheKey := cache.ClipboardCacheKey("id", fmt.Sprintf("%d", clipboard.ID))
	s.cache.Delete(idCacheKey)
	
	return nil
}

// DeleteClipboardCached deletes a clipboard entry and invalidates relevant caches
func (s *CachedClipboardService) DeleteClipboard(clipboard *Clipboard) error {
	err := clipboard.DeleteClipboard()
	if err != nil {
		return err
	}

	// Invalidate all relevant caches
	s.invalidateListCache()
	
	if clipboard.Title != "" {
		titleCacheKey := cache.ClipboardCacheKey("title", clipboard.Title)
		s.cache.Delete(titleCacheKey)
		
		contentCacheKey := cache.ClipboardCacheKey("content", clipboard.Title)
		s.cache.Delete(contentCacheKey)
	}
	
	idCacheKey := cache.ClipboardCacheKey("id", fmt.Sprintf("%d", clipboard.ID))
	s.cache.Delete(idCacheKey)
	
	return nil
}

// invalidateListCache removes the cached list of all clipboards
func (s *CachedClipboardService) invalidateListCache() {
	listCacheKey := cache.ClipboardCacheKey("list", "all")
	s.cache.Delete(listCacheKey)
}

// GetCacheMetrics returns cache performance metrics for clipboard operations
func (s *CachedClipboardService) GetCacheMetrics() *cache.Metrics {
	return s.cache.GetMetrics()
}

// ClearCache clears all clipboard cache entries
func (s *CachedClipboardService) ClearCache() error {
	return s.cache.Clear()
}

// Global cached clipboard service instance
var cachedClipboardService *CachedClipboardService

// GetCachedClipboardService returns the global cached clipboard service instance
func GetCachedClipboardService() *CachedClipboardService {
	if cachedClipboardService == nil {
		cachedClipboardService = NewCachedClipboardService()
	}
	return cachedClipboardService
}

// Cached wrapper functions that can be used as drop-in replacements

// GetAllClipboardsCached is a cached version of GetAllClipboards
func GetAllClipboardsCached() ([]Clipboard, error) {
	return GetCachedClipboardService().GetAllClipboards()
}

// GetClipboardByIDCached is a cached version of GetClipboardByID
func GetClipboardByIDCached(id uint) (*Clipboard, error) {
	return GetCachedClipboardService().GetClipboardByID(id)
}

// GetClipboardByTitleCached is a cached version of GetClipboardByTitle
func GetClipboardByTitleCached(title string) (*Clipboard, error) {
	return GetCachedClipboardService().GetClipboardByTitle(title)
}

// GetClipboardContentByTitleCached gets only the content by title (optimized for /raw/:title)
func GetClipboardContentByTitleCached(title string) (string, error) {
	return GetCachedClipboardService().GetClipboardContentByTitle(title)
}