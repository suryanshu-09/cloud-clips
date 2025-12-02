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

type AppointmentHandler struct {
	storage *storage.MemoryStorage
}

func NewAppointmentHandler(storage *storage.MemoryStorage) *AppointmentHandler {
	return &AppointmentHandler{storage: storage}
}

// Request types
type CreateAppointmentRequest struct {
	BarberID        string    `json:"barberId" binding:"required"`
	ServiceType     string    `json:"serviceType" binding:"required"`
	HairType        string    `json:"hairType"`
	SpecialRequests string    `json:"specialRequests"`
	LocationType    string    `json:"locationType" binding:"required"` // "in_home" or "in_salon"
	LocationAddress string    `json:"locationAddress"`
	Coordinates     []float64 `json:"coordinates"`
	ScheduledFor    string    `json:"scheduledFor" binding:"required"` // ISO 8601 format
	Duration        int       `json:"duration"`
	Price           float64   `json:"price"`
	CouponCode      string    `json:"couponCode"`
}

type UpdateAppointmentRequest struct {
	ScheduledFor    string `json:"scheduledFor"`
	ServiceType     string `json:"serviceType"`
	SpecialRequests string `json:"specialRequests"`
	LocationType    string `json:"locationType"`
	LocationAddress string `json:"locationAddress"`
}

type SubmitReviewRequest struct {
	Rating  int      `json:"rating" binding:"required,min=1,max=5"`
	Comment string   `json:"comment"`
	Photos  []string `json:"photos"`
}

// GET /api/appointments - List user's appointments
func (h *AppointmentHandler) GetAppointments(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDStr, exists := c.Get("userID")

	// Query parameters
	status := c.Query("status")
	role := c.Query("role") // "client" or "barber"
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var userID uuid.UUID
	if exists && userIDStr != nil {
		userID, _ = uuid.Parse(userIDStr.(string))
	}

	appointments := make([]*models.Appointment, 0)
	for _, appointment := range h.storage.Appointments {
		// Filter by user if authenticated
		if exists && userIDStr != nil {
			if role == "barber" {
				if appointment.BarberID != userID {
					continue
				}
			} else {
				if appointment.ClientID != userID {
					continue
				}
			}
		}

		// Filter by status
		if status != "" && string(appointment.Status) != status {
			continue
		}

		appointments = append(appointments, appointment)
	}

	// Sort by scheduled time descending
	sort.Slice(appointments, func(i, j int) bool {
		return appointments[i].ScheduledFor.After(appointments[j].ScheduledFor)
	})

	// Paginate
	total := len(appointments)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"appointments": appointments[start:end],
		"total":        total,
		"page":         page,
		"limit":        limit,
		"totalPages":   (total + limit - 1) / limit,
	})
}

// POST /api/appointments - Create appointment
func (h *AppointmentHandler) CreateAppointment(c *gin.Context) {
	var req CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get client ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	clientID, _ := uuid.Parse(userIDStr.(string))

	// Parse barber ID
	barberID, err := uuid.Parse(req.BarberID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid barber ID"})
		return
	}

	// Verify barber exists
	if _, exists := h.storage.BarberProfiles[barberID]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber not found"})
		return
	}

	// Parse scheduled time
	scheduledFor, err := time.Parse(time.RFC3339, req.ScheduledFor)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use ISO 8601 (RFC3339)"})
		return
	}

	// Validate scheduled time is in the future
	if scheduledFor.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment must be scheduled in the future"})
		return
	}

	// Check for scheduling conflicts
	for _, appt := range h.storage.Appointments {
		if appt.BarberID == barberID &&
			appt.Status != models.AppointmentStatusCancelled &&
			appt.ScheduledFor.Format("2006-01-02 15:04") == scheduledFor.Format("2006-01-02 15:04") {
			c.JSON(http.StatusConflict, gin.H{"error": "This time slot is already booked"})
			return
		}
	}

	// Determine location type
	locationType := models.LocationTypeInSalon
	if req.LocationType == "in_home" {
		locationType = models.LocationTypeInHome
	}

	// Default duration if not specified
	duration := req.Duration
	if duration == 0 {
		duration = 30
	}

	// Apply coupon if provided
	var appliedCouponID *uuid.UUID
	finalPrice := req.Price
	if req.CouponCode != "" {
		for _, coupon := range h.storage.Coupons {
			if coupon.Code == req.CouponCode &&
				time.Now().After(coupon.ValidFrom) &&
				time.Now().Before(coupon.ValidUntil) {

				if coupon.ApplicableTo.Services {
					if coupon.Type == models.CouponTypePercentage {
						discount := finalPrice * (coupon.Value / 100)
						if coupon.MaxDiscount != nil && discount > *coupon.MaxDiscount {
							discount = *coupon.MaxDiscount
						}
						finalPrice -= discount
					} else {
						finalPrice -= coupon.Value
					}
					if finalPrice < 0 {
						finalPrice = 0
					}
					appliedCouponID = &coupon.ID
					coupon.UsageCount++
				}
				break
			}
		}
	}

	// Create appointment
	appointment := &models.Appointment{
		ID:              uuid.New(),
		ClientID:        clientID,
		BarberID:        barberID,
		Status:          models.AppointmentStatusPending,
		ServiceType:     req.ServiceType,
		HairType:        models.HairType(req.HairType),
		SpecialRequests: stringPtr(req.SpecialRequests),
		Location: models.AppointmentLocation{
			Type:        locationType,
			Address:     stringPtr(req.LocationAddress),
			Coordinates: req.Coordinates,
		},
		ScheduledFor:    scheduledFor,
		Duration:        duration,
		Price:           finalPrice,
		AppliedCouponID: appliedCouponID,
		PaymentStatus:   models.PaymentStatusPending,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	h.storage.Appointments[appointment.ID] = appointment

	c.JSON(http.StatusCreated, appointment)
}

// GET /api/appointments/:id - Get appointment details
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

	// Get related data
	var client, barber *models.User
	var barberProfile *models.BarberProfile

	if user, ok := h.storage.Users[appointment.ClientID]; ok {
		client = user
	}
	if user, ok := h.storage.Users[appointment.BarberID]; ok {
		barber = user
	}
	if profile, ok := h.storage.BarberProfiles[appointment.BarberID]; ok {
		barberProfile = profile
	}

	c.JSON(http.StatusOK, gin.H{
		"appointment":   appointment,
		"client":        client,
		"barber":        barber,
		"barberProfile": barberProfile,
	})
}

// PUT /api/appointments/:id - Update appointment (reschedule)
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

	// Can only update pending or confirmed appointments
	if appointment.Status == models.AppointmentStatusCompleted ||
		appointment.Status == models.AppointmentStatusCancelled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot modify completed or cancelled appointments"})
		return
	}

	var req UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ScheduledFor != "" {
		scheduledFor, err := time.Parse(time.RFC3339, req.ScheduledFor)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
		if scheduledFor.Before(time.Now()) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment must be scheduled in the future"})
			return
		}
		appointment.ScheduledFor = scheduledFor
	}

	if req.ServiceType != "" {
		appointment.ServiceType = req.ServiceType
	}

	if req.SpecialRequests != "" {
		appointment.SpecialRequests = &req.SpecialRequests
	}

	if req.LocationType != "" {
		if req.LocationType == "in_home" {
			appointment.Location.Type = models.LocationTypeInHome
		} else {
			appointment.Location.Type = models.LocationTypeInSalon
		}
	}

	if req.LocationAddress != "" {
		appointment.Location.Address = &req.LocationAddress
	}

	appointment.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, appointment)
}

// DELETE /api/appointments/:id - Cancel appointment
func (h *AppointmentHandler) DeleteAppointment(c *gin.Context) {
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

	// Can only cancel pending or confirmed appointments
	if appointment.Status == models.AppointmentStatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel completed appointments"})
		return
	}

	if appointment.Status == models.AppointmentStatusCancelled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment is already cancelled"})
		return
	}

	appointment.Status = models.AppointmentStatusCancelled
	appointment.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Appointment cancelled successfully",
		"appointment": appointment,
	})
}

// POST /api/appointments/:id/confirm - Barber confirms appointment
func (h *AppointmentHandler) ConfirmAppointment(c *gin.Context) {
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

	// Verify the requesting user is the barber
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if appointment.BarberID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only the barber can confirm this appointment"})
			return
		}
	}

	if appointment.Status != models.AppointmentStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only pending appointments can be confirmed"})
		return
	}

	appointment.Status = models.AppointmentStatusConfirmed
	appointment.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Appointment confirmed successfully",
		"appointment": appointment,
	})
}

// POST /api/appointments/:id/complete - Mark as completed
func (h *AppointmentHandler) CompleteAppointment(c *gin.Context) {
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

	if appointment.Status != models.AppointmentStatusConfirmed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only confirmed appointments can be completed"})
		return
	}

	appointment.Status = models.AppointmentStatusCompleted
	appointment.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Appointment completed successfully",
		"appointment": appointment,
	})
}

// POST /api/appointments/:id/review - Submit review for appointment
func (h *AppointmentHandler) SubmitReview(c *gin.Context) {
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

	// Can only review completed appointments
	if appointment.Status != models.AppointmentStatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only review completed appointments"})
		return
	}

	// Check if already reviewed
	for _, review := range h.storage.Reviews {
		if review.AppointmentID == id {
			c.JSON(http.StatusConflict, gin.H{"error": "Appointment has already been reviewed"})
			return
		}
	}

	var req SubmitReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get client ID from context
	userIDStr, exists := c.Get("userID")
	var clientID uuid.UUID
	if exists && userIDStr != nil {
		clientID, _ = uuid.Parse(userIDStr.(string))
	} else {
		clientID = appointment.ClientID
	}

	// Verify the requesting user is the client
	if clientID != appointment.ClientID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the client can review this appointment"})
		return
	}

	review := &models.Review{
		ID:            uuid.New(),
		AppointmentID: id,
		ClientID:      clientID,
		BarberID:      appointment.BarberID,
		Rating:        req.Rating,
		Comment:       stringPtr(req.Comment),
		Photos:        req.Photos,
		CreatedAt:     time.Now(),
	}

	h.storage.Reviews[review.ID] = review

	// Update barber's rating
	if profile, exists := h.storage.BarberProfiles[appointment.BarberID]; exists {
		totalRating := profile.Rating * float64(profile.TotalReviews)
		profile.TotalReviews++
		profile.Rating = (totalRating + float64(req.Rating)) / float64(profile.TotalReviews)
	}

	c.JSON(http.StatusCreated, review)
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
