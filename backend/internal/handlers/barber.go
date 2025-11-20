package handlers

import (
	"net/http"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BarberHandler struct {
	storage *storage.MemoryStorage
}

func NewBarberHandler(storage *storage.MemoryStorage) *BarberHandler {
	return &BarberHandler{storage: storage}
}

func (h *BarberHandler) GetBarberProfiles(c *gin.Context) {
	profiles := make([]*models.BarberProfile, 0)
	for _, profile := range h.storage.BarberProfiles {
		profiles = append(profiles, profile)
	}
	c.JSON(http.StatusOK, gin.H{"profiles": profiles})
}

func (h *BarberHandler) GetBarberProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *BarberHandler) CreateBarberProfile(c *gin.Context) {
	var profile models.BarberProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.ID = uuid.New()
	h.storage.BarberProfiles[profile.ID] = &profile

	c.JSON(http.StatusCreated, profile)
}

func (h *BarberHandler) UpdateBarberProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	if err := c.ShouldBindJSON(profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *BarberHandler) DeleteBarberProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	if _, exists := h.storage.BarberProfiles[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	delete(h.storage.BarberProfiles, id)
	c.JSON(http.StatusOK, gin.H{"message": "Barber profile deleted successfully"})
}
