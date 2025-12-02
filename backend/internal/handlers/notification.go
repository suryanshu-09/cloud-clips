package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	storage *storage.MemoryStorage
}

func NewNotificationHandler(storage *storage.MemoryStorage) *NotificationHandler {
	return &NotificationHandler{storage: storage}
}

// Request types
type RegisterTokenRequest struct {
	Token    string `json:"token" binding:"required"`
	Platform string `json:"platform"` // ios, android, web
}

type CreateNotificationRequest struct {
	UserID string         `json:"userId" binding:"required"`
	Type   string         `json:"type" binding:"required"` // appointment, chat, promo, system
	Title  string         `json:"title" binding:"required"`
	Body   string         `json:"body" binding:"required"`
	Data   map[string]any `json:"data"`
}

// FCM tokens storage (in production, this would be in the database)
var fcmTokens = make(map[uuid.UUID]string) // userID -> FCM token

// GET /api/notifications - List user's notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Query parameters
	unreadOnly := c.Query("unreadOnly") == "true"
	notificationType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	notifications := make([]*models.Notification, 0)
	for _, notification := range h.storage.Notifications {
		if notification.UserID != userID {
			continue
		}

		if unreadOnly && notification.IsRead {
			continue
		}

		if notificationType != "" && string(notification.Type) != notificationType {
			continue
		}

		notifications = append(notifications, notification)
	}

	// Sort by creation time descending
	sort.Slice(notifications, func(i, j int) bool {
		return notifications[i].CreatedAt.After(notifications[j].CreatedAt)
	})

	// Count unread
	unreadCount := 0
	for _, n := range h.storage.Notifications {
		if n.UserID == userID && !n.IsRead {
			unreadCount++
		}
	}

	// Paginate
	total := len(notifications)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications[start:end],
		"total":         total,
		"unreadCount":   unreadCount,
		"page":          page,
		"limit":         limit,
		"totalPages":    (total + limit - 1) / limit,
	})
}

// PUT /api/notifications/:id/read - Mark notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	notification, exists := h.storage.Notifications[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if notification.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify another user's notification"})
			return
		}
	}

	notification.IsRead = true

	c.JSON(http.StatusOK, notification)
}

// PUT /api/notifications/read-all - Mark all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	readCount := 0
	for _, notification := range h.storage.Notifications {
		if notification.UserID == userID && !notification.IsRead {
			notification.IsRead = true
			readCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "All notifications marked as read",
		"readCount": readCount,
	})
}

// DELETE /api/notifications/:id - Delete notification
func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	notification, exists := h.storage.Notifications[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if notification.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete another user's notification"})
			return
		}
	}

	delete(h.storage.Notifications, id)
	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

// POST /api/notifications/token - Register FCM token
func (h *NotificationHandler) RegisterToken(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	var req RegisterTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Store token
	fcmTokens[userID] = req.Token

	c.JSON(http.StatusOK, gin.H{
		"message":  "Token registered successfully",
		"platform": req.Platform,
	})
}

// POST /api/notifications - Create notification (internal/admin)
func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify user exists
	if _, exists := h.storage.Users[userID]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Determine notification type
	notificationType := models.NotificationTypeSystem
	switch req.Type {
	case "appointment":
		notificationType = models.NotificationTypeAppointment
	case "chat":
		notificationType = models.NotificationTypeChat
	case "promo":
		notificationType = models.NotificationTypePromo
	}

	notification := &models.Notification{
		ID:        uuid.New(),
		UserID:    userID,
		Type:      notificationType,
		Title:     req.Title,
		Body:      req.Body,
		Data:      req.Data,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	h.storage.Notifications[notification.ID] = notification

	// TODO: Send push notification via FCM if token exists
	// if token, exists := fcmTokens[userID]; exists {
	//     sendPushNotification(token, notification)
	// }

	c.JSON(http.StatusCreated, notification)
}

// GET /api/notifications/unread-count - Get unread count
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	unreadCount := 0
	for _, notification := range h.storage.Notifications {
		if notification.UserID == userID && !notification.IsRead {
			unreadCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": unreadCount})
}
