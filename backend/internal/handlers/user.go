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

func (h *UserHandler) GetUsers(c *gin.Context) {
	users := make([]*models.User, 0)
	for _, user := range h.storage.Users {
		users = append(users, user)
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

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

	if err := c.ShouldBindJSON(user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

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
