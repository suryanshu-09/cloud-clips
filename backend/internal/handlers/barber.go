package handlers

import (
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

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
