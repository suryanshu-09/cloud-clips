package handlers

import (
	"net/http"
	"strconv"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	storage *storage.MemoryStorage
}

func NewUserHandler(storage *storage.MemoryStorage) *UserHandler {
	return &UserHandler{storage: storage}
}

// GET /api/users - List all users
func (h *UserHandler) GetUsers(c *gin.Context) {
	users := make([]*models.User, 0)
	for _, user := range h.storage.Users {
		users = append(users, user)
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// GET /api/users/:id - Get user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// POST /api/users - Create user (internal use, prefer /api/auth/register)
func (h *UserHandler) CreateUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.ID = uuid.New()
	h.storage.Users[user.ID] = &user

	c.JSON(http.StatusCreated, user)
}

// PUT /api/users/:id - Update user profile
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify user can only update their own profile
	requestingUserID, _ := c.Get("userID")
	if requestingUserID != nil && requestingUserID.(string) != id.String() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update another user's profile"})
		return
	}

	var updateReq struct {
		Name   string `json:"name"`
		Phone  string `json:"phone"`
		Avatar string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateReq.Name != "" {
		user.Name = updateReq.Name
	}
	if updateReq.Phone != "" {
		user.Phone = updateReq.Phone
	}
	if updateReq.Avatar != "" {
		user.Avatar = &updateReq.Avatar
	}

	c.JSON(http.StatusOK, user)
}

// DELETE /api/users/:id - Delete user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if _, exists := h.storage.Users[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	delete(h.storage.Users, id)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// PUT /api/users/:id/avatar - Upload avatar
func (h *UserHandler) UpdateAvatar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		AvatarURL string `json:"avatarUrl" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.Avatar = &req.AvatarURL
	c.JSON(http.StatusOK, user)
}

// GET /api/users/:id/notifications - Get notification settings
func (h *UserHandler) GetNotificationSettings(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userId":      user.ID,
		"preferences": user.NotificationPrefs,
	})
}

// PUT /api/users/:id/notifications - Update notification settings
func (h *UserHandler) UpdateNotificationSettings(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var prefs models.NotificationPrefs
	if err := c.ShouldBindJSON(&prefs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.NotificationPrefs = prefs
	c.JSON(http.StatusOK, gin.H{
		"userId":      user.ID,
		"preferences": user.NotificationPrefs,
		"message":     "Notification settings updated successfully",
	})
}

// GET /api/barbers/nearby - Location-based search (moved from SearchBarbers)
func (h *UserHandler) SearchBarbers(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
	radius, _ := strconv.ParseFloat(c.Query("radius"), 64)

	var barbers []*models.BarberProfile
	for _, profile := range h.storage.BarberProfiles {
		if user, exists := h.storage.Users[profile.UserID]; exists && user.Role == models.RoleBarber {
			barbers = append(barbers, profile)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"barbers": barbers,
		"search": gin.H{
			"lat":    lat,
			"lng":    lng,
			"radius": radius,
		},
	})
}
