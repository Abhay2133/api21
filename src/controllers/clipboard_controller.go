package controllers

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"api21/src/models"
)

// ClipboardController handles clipboard-related HTTP requests
type ClipboardController struct{}

// NewClipboardController creates a new ClipboardController instance
func NewClipboardController() *ClipboardController {
	return &ClipboardController{}
}

// GetClipboards handles GET /api/clipboard - returns all clipboard entries
func (cc *ClipboardController) GetClipboards(c *fiber.Ctx) error {
	// Use cached version for better performance
	clipboards, err := models.GetAllClipboardsCached()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to retrieve clipboard entries",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entries retrieved successfully",
		"data":    clipboards,
		"count":   len(clipboards),
	})
}

// GetClipboard handles GET /api/clipboard/:id - returns a single clipboard entry by ID
func (cc *ClipboardController) GetClipboard(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid clipboard ID",
			"error":   err.Error(),
		})
	}

	// Use cached version for better performance
	clipboard, err := models.GetClipboardByIDCached(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "Clipboard entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to retrieve clipboard entry",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entry retrieved successfully",
		"data":    clipboard,
	})
}

// GetClipboardByTitle handles GET /api/clipboard/title/:title - returns a clipboard entry by title
func (cc *ClipboardController) GetClipboardByTitle(c *fiber.Ctx) error {
	title := c.Params("title")
	if title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Title parameter is required",
		})
	}

	// Use cached version for better performance
	clipboard, err := models.GetClipboardByTitleCached(title)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "Clipboard entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to retrieve clipboard entry",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entry retrieved successfully",
		"data":    clipboard,
	})
}

// GetClipboardRawByTitle handles GET /api/clipboard/raw/:title - returns only the content as plain text
func (cc *ClipboardController) GetClipboardRawByTitle(c *fiber.Ctx) error {
	title := c.Params("title")
	if title == "" {
		return c.Status(fiber.StatusBadRequest).SendString("Title parameter is required")
	}

	// Use optimized cached method that only stores/returns content
	content, err := models.GetClipboardContentByTitleCached(title)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).SendString("Clipboard entry not found")
		}
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to retrieve clipboard entry: " + err.Error())
	}

	// Set content type to plain text and return only the content
	c.Set("Content-Type", "text/plain; charset=utf-8")
	return c.Status(fiber.StatusOK).SendString(content)
}

// CreateClipboard handles POST /api/clipboard - creates a new clipboard entry
func (cc *ClipboardController) CreateClipboard(c *fiber.Ctx) error {
	var requestData struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.BodyParser(&requestData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	if requestData.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Content is required",
		})
	}

	// Note: Title is now optional - if empty, the model will generate a random ID
	clipboard := models.NewClipboard(requestData.Title, requestData.Content)
	
	// Use cached service for proper cache invalidation
	cachedService := models.GetCachedClipboardService()
	if err := cachedService.CreateClipboard(clipboard); err != nil {
		// Check if it's a unique constraint violation (title already exists)
		if err.Error() == "UNIQUE constraint failed: clipboard.title" ||
			strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"message": "A clipboard entry with this title already exists",
				"error":   "Title must be unique",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create clipboard entry",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entry created successfully",
		"data":    clipboard,
	})
}

// UpdateClipboard handles PUT /api/clipboard/:id - updates an existing clipboard entry
func (cc *ClipboardController) UpdateClipboard(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid clipboard ID",
			"error":   err.Error(),
		})
	}

	// Check if clipboard entry exists
	existingClipboard, err := models.GetClipboardByID(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "Clipboard entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to retrieve clipboard entry",
			"error":   err.Error(),
		})
	}

	var requestData struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.BodyParser(&requestData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Update fields if provided
	if requestData.Title != "" {
		existingClipboard.Title = requestData.Title
	}
	if requestData.Content != "" {
		existingClipboard.Content = requestData.Content
	}

	if err := existingClipboard.UpdateClipboard(); err != nil {
		// Check if it's a unique constraint violation
		if err.Error() == "UNIQUE constraint failed: clipboard.title" ||
			strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"message": "A clipboard entry with this title already exists",
				"error":   "Title must be unique",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update clipboard entry",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entry updated successfully",
		"data":    existingClipboard,
	})
}

// DeleteClipboard handles DELETE /api/clipboard/:id - deletes a clipboard entry
func (cc *ClipboardController) DeleteClipboard(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid clipboard ID",
			"error":   err.Error(),
		})
	}

	clipboard, err := models.GetClipboardByID(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "Clipboard entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to retrieve clipboard entry",
			"error":   err.Error(),
		})
	}

	if err := clipboard.DeleteClipboard(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to delete clipboard entry",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Clipboard entry deleted successfully",
	})
}
