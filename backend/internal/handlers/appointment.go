package handlers

import (
	"net/http"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	storage *storage.MemoryStorage
}

func NewAppointmentHandler(storage *storage.MemoryStorage) *AppointmentHandler {
	return &AppointmentHandler{storage: storage}
}

func (h *AppointmentHandler) GetAppointments(c *gin.Context) {
	appointments := make([]*models.Appointment, 0)
	for _, appointment := range h.storage.Appointments {
		appointments = append(appointments, appointment)
	}
	c.JSON(http.StatusOK, gin.H{"appointments": appointments})
}

func (h *AppointmentHandler) GetAppointment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	appointment, exists := h.storage.Appointments[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) CreateAppointment(c *gin.Context) {
	var appointment models.Appointment
	if err := c.ShouldBindJSON(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appointment.ID = uuid.New()
	h.storage.Appointments[appointment.ID] = &appointment

	c.JSON(http.StatusCreated, appointment)
}

func (h *AppointmentHandler) UpdateAppointment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	appointment, exists := h.storage.Appointments[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	if err := c.ShouldBindJSON(appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) DeleteAppointment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	if _, exists := h.storage.Appointments[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	delete(h.storage.Appointments, id)
	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}
