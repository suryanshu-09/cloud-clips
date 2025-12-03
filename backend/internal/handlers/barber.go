package handlers

import (
	"context"
	"math"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/services"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BarberHandler struct {
	storage       *storage.MemoryStorage
	stripeService *services.StripeService
}

func NewBarberHandler(storage *storage.MemoryStorage) *BarberHandler {
	secretKey := os.Getenv("STRIPE_SECRET_KEY")
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")

	return &BarberHandler{
		storage:       storage,
		stripeService: services.NewStripeService(secretKey, webhookSecret),
	}
}

// GET /api/barbers - List barbers with filters
func (h *BarberHandler) GetBarbers(c *gin.Context) {
	// Query parameters for filtering
	specialtyFilter := c.Query("specialty")
	minRating, _ := strconv.ParseFloat(c.Query("minRating"), 64)
	serviceType := c.Query("serviceType")
	verified := c.Query("verified")

	profiles := make([]*models.BarberProfile, 0)
	for _, profile := range h.storage.BarberProfiles {
		// Apply filters
		if specialtyFilter != "" {
			found := false
			for _, s := range profile.Specialties {
				if strings.EqualFold(s, specialtyFilter) {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}

		if minRating > 0 && profile.Rating < minRating {
			continue
		}

		if serviceType != "" {
			found := false
			for _, loc := range profile.ServiceLocations {
				if strings.EqualFold(string(loc), serviceType) {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}

		if verified == "true" && !profile.IsVerified {
			continue
		}

		profiles = append(profiles, profile)
	}

	// Sort by rating descending
	sort.Slice(profiles, func(i, j int) bool {
		return profiles[i].Rating > profiles[j].Rating
	})

	c.JSON(http.StatusOK, gin.H{"barbers": profiles, "total": len(profiles)})
}

// GET /api/barbers/nearby - Location-based search
func (h *BarberHandler) GetNearbyBarbers(c *gin.Context) {
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}

	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	radius, _ := strconv.ParseFloat(c.Query("radius"), 64)
	if radius <= 0 {
		radius = 10 // Default 10 km radius
	}

	type BarberWithDistance struct {
		*models.BarberProfile
		Distance float64 `json:"distance"`
	}

	var nearbyBarbers []BarberWithDistance

	for _, profile := range h.storage.BarberProfiles {
		if len(profile.Location.Coordinates) < 2 {
			continue
		}

		barberLng := profile.Location.Coordinates[0]
		barberLat := profile.Location.Coordinates[1]

		// Calculate distance using Haversine formula
		distance := haversineDistance(lat, lng, barberLat, barberLng)

		if distance <= radius {
			nearbyBarbers = append(nearbyBarbers, BarberWithDistance{
				BarberProfile: profile,
				Distance:      distance,
			})
		}
	}

	// Sort by distance
	sort.Slice(nearbyBarbers, func(i, j int) bool {
		return nearbyBarbers[i].Distance < nearbyBarbers[j].Distance
	})

	c.JSON(http.StatusOK, gin.H{
		"barbers": nearbyBarbers,
		"search": gin.H{
			"lat":    lat,
			"lng":    lng,
			"radius": radius,
		},
		"total": len(nearbyBarbers),
	})
}

// Haversine formula to calculate distance between two points on Earth
func haversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371 // km

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// GET /api/barbers/:id - Get barber profile
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

	// Get user info for the barber
	user, userExists := h.storage.Users[profile.UserID]
	var barberUser *models.User
	if userExists {
		barberUser = user
	}

	c.JSON(http.StatusOK, gin.H{
		"profile": profile,
		"user":    barberUser,
	})
}

// GET /api/barbers/:id/services - Get barber services
func (h *BarberHandler) GetBarberServices(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid barber ID"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"services": profile.Services})
}

// GET /api/barbers/:id/reviews - Get barber reviews
func (h *BarberHandler) GetBarberReviews(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid barber ID"})
		return
	}

	// Get pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var reviews []*models.Review
	for _, review := range h.storage.Reviews {
		if review.BarberID == id {
			reviews = append(reviews, review)
		}
	}

	// Sort by creation date descending
	sort.Slice(reviews, func(i, j int) bool {
		return reviews[i].CreatedAt.After(reviews[j].CreatedAt)
	})

	// Paginate
	total := len(reviews)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	// Calculate average rating
	var totalRating float64
	for _, r := range reviews {
		totalRating += float64(r.Rating)
	}
	avgRating := 0.0
	if total > 0 {
		avgRating = totalRating / float64(total)
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews":    reviews[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"avgRating":  avgRating,
		"totalPages": (total + limit - 1) / limit,
	})
}

// GET /api/barbers/:id/availability - Get available time slots
func (h *BarberHandler) GetBarberAvailability(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid barber ID"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	// Parse date query parameter (defaults to today)
	dateStr := c.Query("date")
	var targetDate time.Time
	if dateStr != "" {
		var parseErr error
		targetDate, parseErr = time.Parse("2006-01-02", dateStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		targetDate = time.Now()
	}

	// Get day of week
	dayOfWeek := strings.ToLower(targetDate.Weekday().String())
	workingHour, hasHours := profile.WorkingHours[dayOfWeek]

	if !hasHours || !workingHour.IsAvailable {
		c.JSON(http.StatusOK, gin.H{
			"date":      targetDate.Format("2006-01-02"),
			"dayOfWeek": dayOfWeek,
			"available": false,
			"slots":     []string{},
			"message":   "Barber is not available on this day",
		})
		return
	}

	// Generate time slots
	startTime, _ := time.Parse("15:04", workingHour.Start)
	endTime, _ := time.Parse("15:04", workingHour.End)

	var slots []gin.H
	slotDuration := 30 * time.Minute

	// Get existing appointments for this barber on this date
	bookedSlots := make(map[string]bool)
	for _, appt := range h.storage.Appointments {
		if appt.BarberID == id &&
			appt.ScheduledFor.Format("2006-01-02") == targetDate.Format("2006-01-02") &&
			appt.Status != models.AppointmentStatusCancelled {
			bookedSlots[appt.ScheduledFor.Format("15:04")] = true
		}
	}

	current := startTime
	for current.Before(endTime) {
		timeStr := current.Format("15:04")
		isBooked := bookedSlots[timeStr]

		slots = append(slots, gin.H{
			"time":      timeStr,
			"available": !isBooked,
		})
		current = current.Add(slotDuration)
	}

	c.JSON(http.StatusOK, gin.H{
		"date":         targetDate.Format("2006-01-02"),
		"dayOfWeek":    dayOfWeek,
		"available":    true,
		"workingHours": workingHour,
		"slots":        slots,
	})
}

// POST /api/barbers - Create barber profile (internal)
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

// PUT /api/barbers/:id - Update barber profile
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

	var updateReq struct {
		BusinessName     *string                  `json:"businessName"`
		Bio              *string                  `json:"bio"`
		Specialties      []string                 `json:"specialties"`
		Experience       int                      `json:"experience"`
		ServiceLocations []models.ServiceLocation `json:"serviceLocations"`
		Location         *models.Location         `json:"location"`
		Address          *string                  `json:"address"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateReq.BusinessName != nil {
		profile.BusinessName = updateReq.BusinessName
	}
	if updateReq.Bio != nil {
		profile.Bio = updateReq.Bio
	}
	if updateReq.Specialties != nil {
		profile.Specialties = updateReq.Specialties
	}
	if updateReq.Experience > 0 {
		profile.Experience = updateReq.Experience
	}
	if updateReq.ServiceLocations != nil {
		profile.ServiceLocations = updateReq.ServiceLocations
	}
	if updateReq.Location != nil {
		profile.Location = *updateReq.Location
	}
	if updateReq.Address != nil {
		profile.Address = updateReq.Address
	}

	c.JSON(http.StatusOK, profile)
}

// PUT /api/barbers/:id/schedule - Update working hours
func (h *BarberHandler) UpdateBarberSchedule(c *gin.Context) {
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

	var schedule map[string]models.WorkingHour
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.WorkingHours = schedule
	c.JSON(http.StatusOK, gin.H{
		"message":      "Schedule updated successfully",
		"workingHours": profile.WorkingHours,
	})
}

// POST /api/barbers/:id/services - Add/update services
func (h *BarberHandler) UpdateBarberServices(c *gin.Context) {
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

	var services []models.Service
	if err := c.ShouldBindJSON(&services); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.Services = services
	c.JSON(http.StatusOK, gin.H{
		"message":  "Services updated successfully",
		"services": profile.Services,
	})
}

// POST /api/barbers/:id/gallery - Upload gallery image
func (h *BarberHandler) AddGalleryImage(c *gin.Context) {
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

	var req struct {
		URL  string `json:"url" binding:"required"`
		Type string `json:"type"` // "before", "after", "work"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Type == "" {
		req.Type = "work"
	}

	galleryItem := models.GalleryItem{
		URL:  req.URL,
		Type: req.Type,
	}

	profile.Gallery = append(profile.Gallery, galleryItem)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Gallery image added successfully",
		"gallery": profile.Gallery,
	})
}

// DELETE /api/barbers/:id/gallery/:imageIndex - Delete gallery image
func (h *BarberHandler) DeleteGalleryImage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	imageIndex, err := strconv.Atoi(c.Param("imageIndex"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image index"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	if imageIndex < 0 || imageIndex >= len(profile.Gallery) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// Remove image at index
	profile.Gallery = append(profile.Gallery[:imageIndex], profile.Gallery[imageIndex+1:]...)
	c.JSON(http.StatusOK, gin.H{
		"message": "Gallery image deleted successfully",
		"gallery": profile.Gallery,
	})
}

// GET /api/barbers/profiles - Get all barber profiles (legacy endpoint)
func (h *BarberHandler) GetBarberProfiles(c *gin.Context) {
	profiles := make([]*models.BarberProfile, 0)
	for _, profile := range h.storage.BarberProfiles {
		profiles = append(profiles, profile)
	}
	c.JSON(http.StatusOK, gin.H{"profiles": profiles})
}

// DELETE /api/barbers/:id - Delete barber profile
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

// ============================================
// STRIPE CONNECT - Barber Payout Endpoints
// ============================================

// POST /api/barbers/:id/connect - Create Stripe Connect account for barber
func (h *BarberHandler) CreateConnectAccount(c *gin.Context) {
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

	// Check if already has Connect account
	if profile.StripeConnectID != nil && *profile.StripeConnectID != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Barber already has a Stripe Connect account",
			"accountId": *profile.StripeConnectID,
		})
		return
	}

	// Get user for email
	user, userExists := h.storage.Users[profile.UserID]
	if !userExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
		// Return mock response for development
		mockAccountID := "acct_mock_" + uuid.New().String()[:16]
		profile.StripeConnectID = &mockAccountID
		profile.StripeConnectStatus = models.ConnectStatusPending
		profile.UpdatedAt = time.Now()

		c.JSON(http.StatusCreated, gin.H{
			"accountId": mockAccountID,
			"status":    models.ConnectStatusPending,
			"_mock":     true,
			"_message":  "This is a mock response. Configure STRIPE_SECRET_KEY for real Connect accounts.",
		})
		return
	}

	// Create Connect account
	businessName := user.Name
	if profile.BusinessName != nil {
		businessName = *profile.BusinessName
	}

	// Parse first and last name
	nameParts := strings.Split(user.Name, " ")
	firstName := nameParts[0]
	lastName := ""
	if len(nameParts) > 1 {
		lastName = strings.Join(nameParts[1:], " ")
	}

	acc, err := h.stripeService.CreateConnectAccount(context.Background(), services.CreateConnectAccountParams{
		Email:        user.Email,
		BusinessName: businessName,
		FirstName:    firstName,
		LastName:     lastName,
		Country:      "US",
		Metadata: map[string]string{
			"barberId": id.String(),
			"userId":   profile.UserID.String(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Connect account: " + err.Error()})
		return
	}

	// Update profile with Connect account ID
	profile.StripeConnectID = &acc.ID
	profile.StripeConnectStatus = models.ConnectStatusPending
	profile.ChargesEnabled = acc.ChargesEnabled
	profile.PayoutsEnabled = acc.PayoutsEnabled
	profile.UpdatedAt = time.Now()

	c.JSON(http.StatusCreated, gin.H{
		"accountId":        acc.ID,
		"status":           models.ConnectStatusPending,
		"chargesEnabled":   acc.ChargesEnabled,
		"payoutsEnabled":   acc.PayoutsEnabled,
		"detailsSubmitted": acc.DetailsSubmitted,
	})
}

// POST /api/barbers/:id/connect/onboarding - Generate Stripe onboarding link
func (h *BarberHandler) CreateOnboardingLink(c *gin.Context) {
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

	if profile.StripeConnectID == nil || *profile.StripeConnectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barber does not have a Connect account. Create one first."})
		return
	}

	var req struct {
		RefreshURL string `json:"refreshUrl"`
		ReturnURL  string `json:"returnUrl"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default URLs if not provided
	if req.RefreshURL == "" {
		req.RefreshURL = os.Getenv("APP_URL") + "/barber/onboarding/refresh"
	}
	if req.ReturnURL == "" {
		req.ReturnURL = os.Getenv("APP_URL") + "/barber/onboarding/complete"
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
		c.JSON(http.StatusOK, gin.H{
			"url":      "https://connect.stripe.com/express/mock-onboarding",
			"_mock":    true,
			"_message": "This is a mock response. Configure STRIPE_SECRET_KEY for real onboarding.",
		})
		return
	}

	link, err := h.stripeService.CreateAccountLink(context.Background(), services.CreateAccountLinkParams{
		AccountID:  *profile.StripeConnectID,
		RefreshURL: req.RefreshURL,
		ReturnURL:  req.ReturnURL,
		Type:       "account_onboarding",
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create onboarding link: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":       link.URL,
		"expiresAt": link.ExpiresAt,
	})
}

// GET /api/barbers/:id/connect/status - Get Connect account status
func (h *BarberHandler) GetConnectStatus(c *gin.Context) {
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

	if profile.StripeConnectID == nil || *profile.StripeConnectID == "" {
		c.JSON(http.StatusOK, gin.H{
			"status":         models.ConnectStatusNone,
			"hasAccount":     false,
			"chargesEnabled": false,
			"payoutsEnabled": false,
			"message":        "Barber has not set up a Connect account",
		})
		return
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
		c.JSON(http.StatusOK, gin.H{
			"accountId":      *profile.StripeConnectID,
			"status":         profile.StripeConnectStatus,
			"hasAccount":     true,
			"chargesEnabled": profile.ChargesEnabled,
			"payoutsEnabled": profile.PayoutsEnabled,
			"_mock":          true,
		})
		return
	}

	status, err := h.stripeService.GetConnectAccountStatus(context.Background(), *profile.StripeConnectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Connect status: " + err.Error()})
		return
	}

	// Update local profile with latest status
	if status.ChargesEnabled && status.PayoutsEnabled && status.DetailsSubmitted {
		profile.StripeConnectStatus = models.ConnectStatusVerified
		now := time.Now()
		profile.ConnectOnboardedAt = &now
	} else if !status.ChargesEnabled || !status.PayoutsEnabled {
		if len(status.Requirements) > 0 {
			profile.StripeConnectStatus = models.ConnectStatusPending
		} else {
			profile.StripeConnectStatus = models.ConnectStatusRestricted
		}
	}
	profile.ChargesEnabled = status.ChargesEnabled
	profile.PayoutsEnabled = status.PayoutsEnabled
	profile.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, gin.H{
		"accountId":        status.AccountID,
		"status":           profile.StripeConnectStatus,
		"hasAccount":       true,
		"detailsSubmitted": status.DetailsSubmitted,
		"chargesEnabled":   status.ChargesEnabled,
		"payoutsEnabled":   status.PayoutsEnabled,
		"requirements":     status.Requirements,
		"createdAt":        status.CreatedAt,
	})
}

// POST /api/barbers/:id/connect/dashboard - Get Stripe Express Dashboard login link
func (h *BarberHandler) GetDashboardLink(c *gin.Context) {
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

	if profile.StripeConnectID == nil || *profile.StripeConnectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barber does not have a Connect account"})
		return
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
		c.JSON(http.StatusOK, gin.H{
			"url":      "https://dashboard.stripe.com/express/mock",
			"_mock":    true,
			"_message": "This is a mock response. Configure STRIPE_SECRET_KEY for real dashboard access.",
		})
		return
	}

	link, err := h.stripeService.CreateLoginLink(context.Background(), *profile.StripeConnectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dashboard link: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url": link.URL,
	})
}

// GET /api/barbers/:id/earnings - Get barber earnings summary
func (h *BarberHandler) GetEarnings(c *gin.Context) {
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

	// Query parameters
	period := c.DefaultQuery("period", "week") // week, month, year, all

	// Calculate date range based on period
	now := time.Now()
	var startDate time.Time
	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = time.Time{} // All time
	}

	// Calculate earnings from completed appointments
	var totalEarnings int64
	var serviceCount int
	var serviceEarnings int64
	var productEarnings int64
	var tips int64

	for _, apt := range h.storage.Appointments {
		if apt.BarberID == id && apt.Status == models.AppointmentStatusCompleted {
			if !startDate.IsZero() && apt.ScheduledFor.Before(startDate) {
				continue
			}
			totalEarnings += int64(apt.Price * 100) // Convert to cents
			serviceEarnings += int64(apt.Price * 100)
			serviceCount++
		}
	}

	// Calculate platform fee
	platformFee := h.stripeService.GetPlatformFee()
	platformFeeAmount := int64(float64(totalEarnings) * platformFee)
	netEarnings := totalEarnings - platformFeeAmount

	// Mock additional data
	if totalEarnings == 0 {
		// Provide mock data for demo purposes
		switch period {
		case "week":
			totalEarnings = 150000   // $1,500
			serviceEarnings = 120000 // $1,200
			productEarnings = 20000  // $200
			tips = 10000             // $100
			serviceCount = 25
		case "month":
			totalEarnings = 660000 // $6,600
			serviceEarnings = 520000
			productEarnings = 100000
			tips = 40000
			serviceCount = 110
		case "year":
			totalEarnings = 8940000 // $89,400
			serviceEarnings = 7200000
			productEarnings = 1200000
			tips = 540000
			serviceCount = 1500
		}
		platformFeeAmount = int64(float64(totalEarnings) * platformFee)
		netEarnings = totalEarnings - platformFeeAmount
	}

	// Get Connect account balance if available
	var availableBalance int64
	var pendingBalance int64

	if profile.StripeConnectID != nil && *profile.StripeConnectID != "" && h.stripeService.IsConfigured() {
		balance, err := h.stripeService.GetBarberBalance(context.Background(), *profile.StripeConnectID)
		if err == nil {
			availableBalance = balance.AvailableBalance
			pendingBalance = balance.PendingBalance
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"period":          period,
		"totalEarnings":   totalEarnings,
		"serviceEarnings": serviceEarnings,
		"productEarnings": productEarnings,
		"tips":            tips,
		"platformFee":     platformFeeAmount,
		"platformFeeRate": platformFee * 100, // As percentage
		"netEarnings":     netEarnings,
		"serviceCount":    serviceCount,
		"avgPerService": func() int64 {
			if serviceCount > 0 {
				return netEarnings / int64(serviceCount)
			}
			return 0
		}(),
		"availableBalance": availableBalance,
		"pendingBalance":   pendingBalance,
		"currency":         "usd",
		"payoutsEnabled":   profile.PayoutsEnabled,
		"connectStatus":    profile.StripeConnectStatus,
	})
}

// GET /api/barbers/:id/earnings/history - Get barber earnings history
func (h *BarberHandler) GetEarningsHistory(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	_, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	// Query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Get transactions from completed appointments
	type EarningItem struct {
		ID           string    `json:"id"`
		Type         string    `json:"type"` // "service", "product", "tip"
		Amount       int64     `json:"amount"`
		Fee          int64     `json:"fee"`
		Net          int64     `json:"net"`
		Description  string    `json:"description"`
		CustomerName string    `json:"customerName"`
		Status       string    `json:"status"`
		Date         time.Time `json:"date"`
	}

	var earnings []EarningItem

	// Get from completed appointments
	for _, apt := range h.storage.Appointments {
		if apt.BarberID == id && apt.Status == models.AppointmentStatusCompleted {
			amount := int64(apt.Price * 100)
			fee := int64(float64(amount) * h.stripeService.GetPlatformFee())
			net := amount - fee

			customerName := "Customer"
			if user, exists := h.storage.Users[apt.ClientID]; exists {
				customerName = user.Name
			}

			earnings = append(earnings, EarningItem{
				ID:           apt.ID.String(),
				Type:         "service",
				Amount:       amount,
				Fee:          fee,
				Net:          net,
				Description:  apt.ServiceType,
				CustomerName: customerName,
				Status:       "completed",
				Date:         apt.UpdatedAt,
			})
		}
	}

	// Sort by date descending
	sort.Slice(earnings, func(i, j int) bool {
		return earnings[i].Date.After(earnings[j].Date)
	})

	// If no real data, provide mock data
	if len(earnings) == 0 {
		// Generate mock earnings history
		for i := 0; i < 20; i++ {
			date := time.Now().AddDate(0, 0, -i)
			amount := int64((30 + i%5) * 100 * 100) // $30-$35
			fee := int64(float64(amount) * h.stripeService.GetPlatformFee())
			earnings = append(earnings, EarningItem{
				ID:           uuid.New().String(),
				Type:         "service",
				Amount:       amount,
				Fee:          fee,
				Net:          amount - fee,
				Description:  "Haircut + Beard Trim",
				CustomerName: "John Doe",
				Status:       "completed",
				Date:         date,
			})
		}
	}

	// Paginate
	total := len(earnings)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"earnings":   earnings[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}

// GET /api/barbers/:id/payouts - Get barber payout history
func (h *BarberHandler) GetPayouts(c *gin.Context) {
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

	if profile.StripeConnectID == nil || *profile.StripeConnectID == "" {
		c.JSON(http.StatusOK, gin.H{
			"payouts": []interface{}{},
			"total":   0,
			"message": "No Connect account. Set up payouts to view history.",
		})
		return
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
		// Return mock payouts
		mockPayouts := []gin.H{
			{
				"id":          "po_mock_" + uuid.New().String()[:8],
				"amount":      125000,
				"currency":    "usd",
				"status":      "paid",
				"arrivalDate": time.Now().AddDate(0, 0, -3),
				"createdAt":   time.Now().AddDate(0, 0, -5),
			},
			{
				"id":          "po_mock_" + uuid.New().String()[:8],
				"amount":      98500,
				"currency":    "usd",
				"status":      "paid",
				"arrivalDate": time.Now().AddDate(0, 0, -10),
				"createdAt":   time.Now().AddDate(0, 0, -12),
			},
		}
		c.JSON(http.StatusOK, gin.H{
			"payouts": mockPayouts,
			"total":   len(mockPayouts),
			"_mock":   true,
		})
		return
	}

	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "25"), 10, 64)
	status := c.Query("status")

	payouts, err := h.stripeService.ListPayouts(context.Background(), services.ListPayoutsParams{
		AccountID: *profile.StripeConnectID,
		Limit:     limit,
		Status:    status,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payouts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payouts": payouts,
		"total":   len(payouts),
	})
}
