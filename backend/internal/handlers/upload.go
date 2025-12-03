package handlers

import (
	"net/http"

	"cloud-clips/internal/services"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadHandler handles all file upload operations
type UploadHandler struct {
	storage      *storage.MemoryStorage
	mediaService *services.MediaService
}

// NewUploadHandler creates a new upload handler instance
func NewUploadHandler(storage *storage.MemoryStorage, mediaService *services.MediaService) *UploadHandler {
	return &UploadHandler{
		storage:      storage,
		mediaService: mediaService,
	}
}

// UploadAvatar handles avatar image upload
// POST /api/uploads/avatar
func (h *UploadHandler) UploadAvatar(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	opts := services.UploadOptions{
		Category:       "avatars",
		UserID:         userID.(string),
		GenerateThumbs: true,
		ResizeImage:    true,
		Quality:        85,
	}

	result, err := h.mediaService.Upload(c.Request.Context(), file, opts)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update user avatar in storage
	uid, err := uuid.Parse(userID.(string))
	if err == nil {
		if user, exists := h.storage.Users[uid]; exists {
			user.Avatar = &result.URL
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Avatar uploaded successfully",
		"data":    result,
	})
}

// UploadGalleryImage handles barber gallery image upload
// POST /api/uploads/gallery
func (h *UploadHandler) UploadGalleryImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get image type from form
	imageType := c.DefaultPostForm("type", "after")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	opts := services.UploadOptions{
		Category:       "gallery",
		UserID:         userID.(string),
		GenerateThumbs: true,
		ResizeImage:    true,
		Quality:        85,
	}

	result, err := h.mediaService.Upload(c.Request.Context(), file, opts)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Gallery image uploaded successfully",
		"data": gin.H{
			"id":           result.ID,
			"url":          result.URL,
			"thumbnailUrl": result.ThumbnailURL,
			"type":         imageType,
			"size":         result.Size,
			"width":        result.Width,
			"height":       result.Height,
		},
	})
}

// UploadGalleryImages handles multiple gallery image uploads
// POST /api/uploads/gallery/batch
func (h *UploadHandler) UploadGalleryImages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files provided"})
		return
	}

	// Limit batch size
	maxFiles := 10
	if len(files) > maxFiles {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Too many files",
			"max":   maxFiles,
		})
		return
	}

	opts := services.UploadOptions{
		Category:       "gallery",
		UserID:         userID.(string),
		GenerateThumbs: true,
		ResizeImage:    true,
		Quality:        85,
	}

	results, errs := h.mediaService.BatchUpload(c.Request.Context(), files, opts)

	// Build response
	uploadedFiles := make([]gin.H, 0)
	failedFiles := make([]gin.H, 0)

	for i, result := range results {
		if errs[i] != nil {
			failedFiles = append(failedFiles, gin.H{
				"filename": files[i].Filename,
				"error":    errs[i].Error(),
			})
		} else {
			uploadedFiles = append(uploadedFiles, gin.H{
				"id":           result.ID,
				"url":          result.URL,
				"thumbnailUrl": result.ThumbnailURL,
				"filename":     result.Filename,
				"size":         result.Size,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Batch upload completed",
		"uploaded":  uploadedFiles,
		"failed":    failedFiles,
		"total":     len(files),
		"succeeded": len(uploadedFiles),
	})
}

// UploadProductImage handles product image upload
// POST /api/uploads/product
func (h *UploadHandler) UploadProductImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	productID := c.PostForm("productId")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	opts := services.UploadOptions{
		Category:       "products",
		UserID:         userID.(string),
		GenerateThumbs: true,
		ResizeImage:    true,
		Quality:        90,
	}

	result, err := h.mediaService.Upload(c.Request.Context(), file, opts)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update product images if productId provided
	if productID != "" {
		pid, err := uuid.Parse(productID)
		if err == nil {
			if product, exists := h.storage.Products[pid]; exists {
				product.Images = append(product.Images, result.URL)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product image uploaded successfully",
		"data":    result,
	})
}

// UploadReviewPhotos handles review photo uploads (up to 3 images)
// POST /api/uploads/review
func (h *UploadHandler) UploadReviewPhotos(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files provided"})
		return
	}

	// Limit to 3 photos for reviews
	maxFiles := 3
	if len(files) > maxFiles {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Maximum 3 photos allowed for reviews",
			"max":   maxFiles,
		})
		return
	}

	opts := services.UploadOptions{
		Category:       "reviews",
		UserID:         userID.(string),
		GenerateThumbs: true,
		ResizeImage:    true,
		Quality:        85,
	}

	results, errs := h.mediaService.BatchUpload(c.Request.Context(), files, opts)

	// Build response
	uploadedURLs := make([]string, 0)
	failedFiles := make([]gin.H, 0)

	for i, result := range results {
		if errs[i] != nil {
			failedFiles = append(failedFiles, gin.H{
				"filename": files[i].Filename,
				"error":    errs[i].Error(),
			})
		} else {
			uploadedURLs = append(uploadedURLs, result.URL)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Review photos uploaded successfully",
		"photos":    uploadedURLs,
		"failed":    failedFiles,
		"total":     len(files),
		"succeeded": len(uploadedURLs),
	})
}

// DeleteImage handles image deletion
// DELETE /api/uploads
func (h *UploadHandler) DeleteImage(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL is required"})
		return
	}

	if err := h.mediaService.Delete(c.Request.Context(), req.URL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image deleted successfully",
	})
}

// GetUploadPolicy returns a presigned URL for direct upload (S3)
// GET /api/uploads/policy
func (h *UploadHandler) GetUploadPolicy(c *gin.Context) {
	// This endpoint would be used for direct browser uploads to S3
	// For now, return a message explaining this is a future feature
	c.JSON(http.StatusOK, gin.H{
		"message": "Direct upload policy not yet implemented. Use POST /api/uploads/* endpoints instead.",
	})
}

// UploadGeneric handles generic file upload
// POST /api/uploads
func (h *UploadHandler) UploadGeneric(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	category := c.DefaultPostForm("category", "misc")

	// Validate category
	allowedCategories := map[string]bool{
		"avatars":  true,
		"gallery":  true,
		"products": true,
		"reviews":  true,
		"misc":     true,
	}
	if !allowedCategories[category] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "Invalid category",
			"allowedCategories": []string{"avatars", "gallery", "products", "reviews", "misc"},
		})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	opts := services.UploadOptions{
		Category:       category,
		UserID:         userID.(string),
		GenerateThumbs: c.DefaultPostForm("generateThumbs", "true") == "true",
		ResizeImage:    c.DefaultPostForm("resize", "true") == "true",
		Quality:        85,
	}

	result, err := h.mediaService.Upload(c.Request.Context(), file, opts)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"data":    result,
	})
}
