package services

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/nfnt/resize"
)

// MediaStorageType represents the storage backend type
type MediaStorageType string

const (
	StorageTypeLocal    MediaStorageType = "local"
	StorageTypeS3       MediaStorageType = "s3"
	StorageTypeFirebase MediaStorageType = "firebase"
)

// MediaConfig holds configuration for media storage
type MediaConfig struct {
	StorageType MediaStorageType
	BaseURL     string

	// Local storage
	LocalPath string

	// S3 configuration
	S3Bucket          string
	S3Region          string
	S3AccessKeyID     string
	S3SecretAccessKey string
	S3Endpoint        string // Optional: for S3-compatible services

	// Firebase Storage configuration
	FirebaseBucket string

	// Image processing
	MaxFileSize     int64 // Max file size in bytes (default: 5MB)
	ThumbnailWidth  uint  // Thumbnail width (default: 200)
	ThumbnailHeight uint  // Thumbnail height (default: 200)
	MaxImageWidth   uint  // Max image width for resizing (default: 1920)
	MaxImageHeight  uint  // Max image height for resizing (default: 1080)
}

// MediaService handles image upload, processing, and storage
type MediaService struct {
	config   MediaConfig
	s3Client *s3.Client
}

// UploadedMedia represents a successfully uploaded media file
type UploadedMedia struct {
	ID           string    `json:"id"`
	URL          string    `json:"url"`
	ThumbnailURL string    `json:"thumbnailUrl,omitempty"`
	Filename     string    `json:"filename"`
	ContentType  string    `json:"contentType"`
	Size         int64     `json:"size"`
	Width        int       `json:"width,omitempty"`
	Height       int       `json:"height,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// AllowedMimeTypes defines the allowed image MIME types
var AllowedMimeTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// NewMediaService creates a new media service instance
func NewMediaService(cfg MediaConfig) (*MediaService, error) {
	// Set defaults
	if cfg.MaxFileSize == 0 {
		cfg.MaxFileSize = 5 * 1024 * 1024 // 5MB
	}
	if cfg.ThumbnailWidth == 0 {
		cfg.ThumbnailWidth = 200
	}
	if cfg.ThumbnailHeight == 0 {
		cfg.ThumbnailHeight = 200
	}
	if cfg.MaxImageWidth == 0 {
		cfg.MaxImageWidth = 1920
	}
	if cfg.MaxImageHeight == 0 {
		cfg.MaxImageHeight = 1080
	}

	service := &MediaService{
		config: cfg,
	}

	// Initialize storage backend
	switch cfg.StorageType {
	case StorageTypeS3:
		if err := service.initS3Client(); err != nil {
			return nil, fmt.Errorf("failed to initialize S3 client: %w", err)
		}
	case StorageTypeLocal:
		if cfg.LocalPath == "" {
			cfg.LocalPath = "./uploads"
		}
		// Create directories for local storage
		dirs := []string{
			filepath.Join(cfg.LocalPath, "avatars"),
			filepath.Join(cfg.LocalPath, "gallery"),
			filepath.Join(cfg.LocalPath, "products"),
			filepath.Join(cfg.LocalPath, "reviews"),
			filepath.Join(cfg.LocalPath, "thumbnails"),
		}
		for _, dir := range dirs {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return nil, fmt.Errorf("failed to create directory %s: %w", dir, err)
			}
		}
		service.config = cfg
	case StorageTypeFirebase:
		// Firebase Storage would be initialized here
		// For now, it's handled through the Firebase Admin SDK
	}

	return service, nil
}

// initS3Client initializes the AWS S3 client
func (m *MediaService) initS3Client() error {
	var cfg aws.Config
	var err error

	if m.config.S3AccessKeyID != "" && m.config.S3SecretAccessKey != "" {
		// Use provided credentials
		cfg, err = config.LoadDefaultConfig(context.Background(),
			config.WithRegion(m.config.S3Region),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				m.config.S3AccessKeyID,
				m.config.S3SecretAccessKey,
				"",
			)),
		)
	} else {
		// Use default credential chain (IAM role, env vars, etc.)
		cfg, err = config.LoadDefaultConfig(context.Background(),
			config.WithRegion(m.config.S3Region),
		)
	}

	if err != nil {
		return err
	}

	// Create S3 client with optional custom endpoint (for MinIO, DigitalOcean Spaces, etc.)
	if m.config.S3Endpoint != "" {
		m.s3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(m.config.S3Endpoint)
			o.UsePathStyle = true
		})
	} else {
		m.s3Client = s3.NewFromConfig(cfg)
	}

	return nil
}

// IsConfigured returns true if the media service is properly configured
func (m *MediaService) IsConfigured() bool {
	switch m.config.StorageType {
	case StorageTypeS3:
		return m.s3Client != nil && m.config.S3Bucket != ""
	case StorageTypeLocal:
		return m.config.LocalPath != ""
	case StorageTypeFirebase:
		return m.config.FirebaseBucket != ""
	default:
		return false
	}
}

// ValidateFile validates the uploaded file
func (m *MediaService) ValidateFile(file *multipart.FileHeader) error {
	// Check file size
	if file.Size > m.config.MaxFileSize {
		return fmt.Errorf("file size %d exceeds maximum allowed size of %d bytes", file.Size, m.config.MaxFileSize)
	}

	// Check content type
	contentType := file.Header.Get("Content-Type")
	if _, allowed := AllowedMimeTypes[contentType]; !allowed {
		return fmt.Errorf("file type %s is not allowed. Allowed types: jpg, png, webp, gif", contentType)
	}

	return nil
}

// DetectContentType detects the content type of a file by reading its magic bytes
func DetectContentType(file io.ReadSeeker) (string, error) {
	// Read first 512 bytes for content type detection
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", err
	}

	// Reset file position
	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return "", err
	}

	return http.DetectContentType(buffer), nil
}

// UploadOptions defines options for file upload
type UploadOptions struct {
	Category       string // avatars, gallery, products, reviews
	UserID         string // Owner's user ID
	GenerateThumbs bool   // Whether to generate thumbnails
	ResizeImage    bool   // Whether to resize large images
	Quality        int    // JPEG quality (1-100, default: 85)
}

// Upload handles the file upload process
func (m *MediaService) Upload(ctx context.Context, file *multipart.FileHeader, opts UploadOptions) (*UploadedMedia, error) {
	// Validate file
	if err := m.ValidateFile(file); err != nil {
		return nil, err
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Read file content
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Detect actual content type
	contentType := http.DetectContentType(fileBytes)
	if _, allowed := AllowedMimeTypes[contentType]; !allowed {
		return nil, fmt.Errorf("detected file type %s is not allowed", contentType)
	}

	// Generate unique filename
	ext := AllowedMimeTypes[contentType]
	fileID := uuid.New().String()
	filename := fmt.Sprintf("%s%s", fileID, ext)

	// Process image if needed
	var processedBytes []byte
	var width, height int

	if opts.ResizeImage || opts.GenerateThumbs {
		img, _, err := image.Decode(bytes.NewReader(fileBytes))
		if err != nil {
			// If we can't decode, use original bytes
			processedBytes = fileBytes
		} else {
			bounds := img.Bounds()
			width = bounds.Dx()
			height = bounds.Dy()

			// Resize if needed
			if opts.ResizeImage && (uint(width) > m.config.MaxImageWidth || uint(height) > m.config.MaxImageHeight) {
				img = resize.Thumbnail(m.config.MaxImageWidth, m.config.MaxImageHeight, img, resize.Lanczos3)
				bounds = img.Bounds()
				width = bounds.Dx()
				height = bounds.Dy()
			}

			// Encode processed image
			var buf bytes.Buffer
			quality := opts.Quality
			if quality == 0 {
				quality = 85
			}

			switch contentType {
			case "image/jpeg":
				err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
			case "image/png":
				err = png.Encode(&buf, img)
			default:
				err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
				contentType = "image/jpeg"
				ext = ".jpg"
				filename = fmt.Sprintf("%s%s", fileID, ext)
			}

			if err != nil {
				processedBytes = fileBytes
			} else {
				processedBytes = buf.Bytes()
			}
		}
	} else {
		processedBytes = fileBytes
	}

	// Build the storage path
	storagePath := m.buildStoragePath(opts.Category, opts.UserID, filename)

	// Upload to storage backend
	url, err := m.uploadToStorage(ctx, storagePath, processedBytes, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate and upload thumbnail if requested
	var thumbnailURL string
	if opts.GenerateThumbs && width > 0 && height > 0 {
		thumbURL, err := m.generateAndUploadThumbnail(ctx, fileBytes, opts.Category, opts.UserID, fileID, contentType)
		if err == nil {
			thumbnailURL = thumbURL
		}
	}

	return &UploadedMedia{
		ID:           fileID,
		URL:          url,
		ThumbnailURL: thumbnailURL,
		Filename:     filename,
		ContentType:  contentType,
		Size:         int64(len(processedBytes)),
		Width:        width,
		Height:       height,
		CreatedAt:    time.Now(),
	}, nil
}

// UploadFromBytes uploads image data directly from bytes
func (m *MediaService) UploadFromBytes(ctx context.Context, data []byte, contentType string, opts UploadOptions) (*UploadedMedia, error) {
	// Validate content type
	if _, allowed := AllowedMimeTypes[contentType]; !allowed {
		return nil, fmt.Errorf("file type %s is not allowed", contentType)
	}

	// Check file size
	if int64(len(data)) > m.config.MaxFileSize {
		return nil, fmt.Errorf("file size %d exceeds maximum allowed size", len(data))
	}

	// Generate unique filename
	ext := AllowedMimeTypes[contentType]
	fileID := uuid.New().String()
	filename := fmt.Sprintf("%s%s", fileID, ext)

	// Process image
	var processedBytes []byte
	var width, height int

	img, _, err := image.Decode(bytes.NewReader(data))
	if err == nil {
		bounds := img.Bounds()
		width = bounds.Dx()
		height = bounds.Dy()

		// Resize if needed
		if opts.ResizeImage && (uint(width) > m.config.MaxImageWidth || uint(height) > m.config.MaxImageHeight) {
			img = resize.Thumbnail(m.config.MaxImageWidth, m.config.MaxImageHeight, img, resize.Lanczos3)
			bounds = img.Bounds()
			width = bounds.Dx()
			height = bounds.Dy()
		}

		// Encode processed image
		var buf bytes.Buffer
		quality := opts.Quality
		if quality == 0 {
			quality = 85
		}

		switch contentType {
		case "image/jpeg":
			jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
		case "image/png":
			png.Encode(&buf, img)
		default:
			jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
		}

		processedBytes = buf.Bytes()
	} else {
		processedBytes = data
	}

	// Build the storage path
	storagePath := m.buildStoragePath(opts.Category, opts.UserID, filename)

	// Upload to storage backend
	url, err := m.uploadToStorage(ctx, storagePath, processedBytes, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate thumbnail if requested
	var thumbnailURL string
	if opts.GenerateThumbs && width > 0 {
		thumbURL, err := m.generateAndUploadThumbnail(ctx, data, opts.Category, opts.UserID, fileID, contentType)
		if err == nil {
			thumbnailURL = thumbURL
		}
	}

	return &UploadedMedia{
		ID:           fileID,
		URL:          url,
		ThumbnailURL: thumbnailURL,
		Filename:     filename,
		ContentType:  contentType,
		Size:         int64(len(processedBytes)),
		Width:        width,
		Height:       height,
		CreatedAt:    time.Now(),
	}, nil
}

// buildStoragePath constructs the storage path for a file
func (m *MediaService) buildStoragePath(category, userID, filename string) string {
	if category == "" {
		category = "misc"
	}

	if userID != "" {
		return fmt.Sprintf("%s/%s/%s", category, userID, filename)
	}

	return fmt.Sprintf("%s/%s", category, filename)
}

// uploadToStorage uploads data to the configured storage backend
func (m *MediaService) uploadToStorage(ctx context.Context, path string, data []byte, contentType string) (string, error) {
	switch m.config.StorageType {
	case StorageTypeS3:
		return m.uploadToS3(ctx, path, data, contentType)
	case StorageTypeLocal:
		return m.uploadToLocal(ctx, path, data)
	case StorageTypeFirebase:
		return m.uploadToFirebase(ctx, path, data, contentType)
	default:
		return "", errors.New("unsupported storage type")
	}
}

// uploadToS3 uploads data to AWS S3
func (m *MediaService) uploadToS3(ctx context.Context, path string, data []byte, contentType string) (string, error) {
	if m.s3Client == nil {
		return "", errors.New("S3 client not initialized")
	}

	_, err := m.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:       aws.String(m.config.S3Bucket),
		Key:          aws.String(path),
		Body:         bytes.NewReader(data),
		ContentType:  aws.String(contentType),
		CacheControl: aws.String("max-age=31536000"), // 1 year cache
	})

	if err != nil {
		return "", err
	}

	// Build URL
	if m.config.BaseURL != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(m.config.BaseURL, "/"), path), nil
	}

	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", m.config.S3Bucket, m.config.S3Region, path), nil
}

// uploadToLocal uploads data to local filesystem
func (m *MediaService) uploadToLocal(ctx context.Context, path string, data []byte) (string, error) {
	fullPath := filepath.Join(m.config.LocalPath, path)

	// Create directory if needed
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Write file
	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Build URL
	if m.config.BaseURL != "" {
		return fmt.Sprintf("%s/uploads/%s", strings.TrimSuffix(m.config.BaseURL, "/"), path), nil
	}

	return fmt.Sprintf("/uploads/%s", path), nil
}

// uploadToFirebase uploads data to Firebase Storage
func (m *MediaService) uploadToFirebase(ctx context.Context, path string, data []byte, contentType string) (string, error) {
	// Firebase Storage upload would be implemented here using the Firebase Admin SDK
	// For now, return an error suggesting to use S3 or local storage
	return "", errors.New("Firebase Storage upload not implemented - use S3 or local storage")
}

// generateAndUploadThumbnail generates a thumbnail and uploads it
func (m *MediaService) generateAndUploadThumbnail(ctx context.Context, data []byte, category, userID, fileID, contentType string) (string, error) {
	// Decode image
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", err
	}

	// Generate thumbnail
	thumb := resize.Thumbnail(m.config.ThumbnailWidth, m.config.ThumbnailHeight, img, resize.Lanczos3)

	// Encode thumbnail
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, thumb, &jpeg.Options{Quality: 80}); err != nil {
		return "", err
	}

	// Build thumbnail path
	thumbFilename := fmt.Sprintf("%s_thumb.jpg", fileID)
	thumbPath := m.buildStoragePath("thumbnails/"+category, userID, thumbFilename)

	// Upload thumbnail
	return m.uploadToStorage(ctx, thumbPath, buf.Bytes(), "image/jpeg")
}

// Delete removes a file from storage
func (m *MediaService) Delete(ctx context.Context, fileURL string) error {
	// Extract path from URL
	path := m.extractPathFromURL(fileURL)
	if path == "" {
		return errors.New("invalid file URL")
	}

	switch m.config.StorageType {
	case StorageTypeS3:
		return m.deleteFromS3(ctx, path)
	case StorageTypeLocal:
		return m.deleteFromLocal(ctx, path)
	case StorageTypeFirebase:
		return errors.New("Firebase Storage delete not implemented")
	default:
		return errors.New("unsupported storage type")
	}
}

// deleteFromS3 deletes a file from S3
func (m *MediaService) deleteFromS3(ctx context.Context, path string) error {
	if m.s3Client == nil {
		return errors.New("S3 client not initialized")
	}

	_, err := m.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(m.config.S3Bucket),
		Key:    aws.String(path),
	})

	return err
}

// deleteFromLocal deletes a file from local storage
func (m *MediaService) deleteFromLocal(ctx context.Context, path string) error {
	fullPath := filepath.Join(m.config.LocalPath, path)
	return os.Remove(fullPath)
}

// extractPathFromURL extracts the storage path from a URL
func (m *MediaService) extractPathFromURL(url string) string {
	// Remove base URL if present
	if m.config.BaseURL != "" {
		url = strings.TrimPrefix(url, m.config.BaseURL)
		url = strings.TrimPrefix(url, "/uploads/")
	}

	// Remove S3 URL prefix
	if m.config.S3Bucket != "" {
		prefix := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/", m.config.S3Bucket, m.config.S3Region)
		url = strings.TrimPrefix(url, prefix)
	}

	return strings.TrimPrefix(url, "/")
}

// GetMD5Hash generates MD5 hash for deduplication
func GetMD5Hash(data []byte) string {
	hash := md5.Sum(data)
	return hex.EncodeToString(hash[:])
}

// BatchUpload uploads multiple files concurrently
func (m *MediaService) BatchUpload(ctx context.Context, files []*multipart.FileHeader, opts UploadOptions) ([]*UploadedMedia, []error) {
	results := make([]*UploadedMedia, len(files))
	errors := make([]error, len(files))

	// Use a simple sequential approach for now
	// Could be parallelized with goroutines for better performance
	for i, file := range files {
		result, err := m.Upload(ctx, file, opts)
		results[i] = result
		errors[i] = err
	}

	return results, errors
}
