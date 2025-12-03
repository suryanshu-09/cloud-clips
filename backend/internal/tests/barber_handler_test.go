package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cloud-clips/internal/handlers"
	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupBarberTestRouter() (*gin.Engine, *storage.MemoryStorage) {
	gin.SetMode(gin.TestMode)
	store := storage.NewMemoryStorage()
	barberHandler := handlers.NewBarberHandler(store)

	router := gin.New()
	router.GET("/api/barbers", barberHandler.GetBarbers)
	router.GET("/api/barbers/nearby", barberHandler.GetNearbyBarbers)
	router.GET("/api/barbers/profiles", barberHandler.GetBarberProfiles)
	router.GET("/api/barbers/:id", barberHandler.GetBarberProfile)
	router.GET("/api/barbers/:id/services", barberHandler.GetBarberServices)
	router.GET("/api/barbers/:id/reviews", barberHandler.GetBarberReviews)
	router.GET("/api/barbers/:id/availability", barberHandler.GetBarberAvailability)
	router.POST("/api/barbers", barberHandler.CreateBarberProfile)
	router.PUT("/api/barbers/:id", barberHandler.UpdateBarberProfile)
	router.PUT("/api/barbers/:id/schedule", barberHandler.UpdateBarberSchedule)
	router.POST("/api/barbers/:id/services", barberHandler.UpdateBarberServices)
	router.POST("/api/barbers/:id/gallery", barberHandler.AddGalleryImage)
	router.DELETE("/api/barbers/:id/gallery/:imageIndex", barberHandler.DeleteGalleryImage)
	router.DELETE("/api/barbers/:id", barberHandler.DeleteBarberProfile)
	router.GET("/api/barbers/:id/earnings", barberHandler.GetEarnings)
	router.GET("/api/barbers/:id/earnings/history", barberHandler.GetEarningsHistory)
	router.GET("/api/barbers/:id/payouts", barberHandler.GetPayouts)
	router.POST("/api/barbers/:id/connect", barberHandler.CreateConnectAccount)
	router.POST("/api/barbers/:id/connect/onboarding", barberHandler.CreateOnboardingLink)
	router.GET("/api/barbers/:id/connect/status", barberHandler.GetConnectStatus)
	router.POST("/api/barbers/:id/connect/dashboard", barberHandler.GetDashboardLink)

	return router, store
}

func createTestBarberProfile(store *storage.MemoryStorage) (*models.User, *models.BarberProfile) {
	userID := uuid.New()
	user := &models.User{
		ID:       userID,
		Email:    fmt.Sprintf("barber-%s@example.com", userID.String()[:8]),
		Name:     "Test Barber",
		Role:     models.RoleBarber,
		Location: models.Location{Type: "Point", Coordinates: []float64{-74.0060, 40.7128}},
	}
	store.Users[userID] = user

	businessName := "Elite Cuts"
	bio := "Professional barber with 10 years experience"
	address := "123 Main St, NYC"
	profile := &models.BarberProfile{
		ID:           userID,
		UserID:       userID,
		BusinessName: &businessName,
		Bio:          &bio,
		Specialties:  []string{"Fade", "Beard Trim", "Classic Cut"},
		Experience:   10,
		ServiceLocations: []models.ServiceLocation{
			models.ServiceLocationInSalon,
			models.ServiceLocationInHome,
		},
		WorkingHours: map[string]models.WorkingHour{
			"monday":    {Start: "09:00", End: "18:00", IsAvailable: true},
			"tuesday":   {Start: "09:00", End: "18:00", IsAvailable: true},
			"wednesday": {Start: "09:00", End: "18:00", IsAvailable: true},
			"thursday":  {Start: "09:00", End: "18:00", IsAvailable: true},
			"friday":    {Start: "09:00", End: "18:00", IsAvailable: true},
			"saturday":  {Start: "10:00", End: "16:00", IsAvailable: true},
			"sunday":    {Start: "00:00", End: "00:00", IsAvailable: false},
		},
		Services: []models.Service{
			{Name: "Basic Cut", Price: 25.00, Duration: 30},
			{Name: "Fade", Price: 35.00, Duration: 45},
		},
		Gallery:      []models.GalleryItem{},
		Rating:       4.8,
		TotalReviews: 127,
		IsVerified:   true,
		Location:     models.Location{Type: "Point", Coordinates: []float64{-74.0060, 40.7128}},
		Address:      &address,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	store.BarberProfiles[userID] = profile

	return user, profile
}

func TestBarberHandler_GetBarbers_Empty(t *testing.T) {
	router, _ := setupBarberTestRouter()

	req, _ := http.NewRequest("GET", "/api/barbers", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(0), response["total"])
}

func TestBarberHandler_GetBarbers_WithBarbers(t *testing.T) {
	router, store := setupBarberTestRouter()
	createTestBarberProfile(store)
	createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(2), response["total"])
}

func TestBarberHandler_GetBarbers_FilterBySpecialty(t *testing.T) {
	router, store := setupBarberTestRouter()
	createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers?specialty=Fade", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestBarberHandler_GetBarbers_FilterByMinRating(t *testing.T) {
	router, store := setupBarberTestRouter()
	createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers?minRating=4.5", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])

	// Filter by higher rating
	req, _ = http.NewRequest("GET", "/api/barbers?minRating=4.9", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["total"])
}

func TestBarberHandler_GetBarbers_FilterByVerified(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)
	profile.IsVerified = true

	req, _ := http.NewRequest("GET", "/api/barbers?verified=true", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestBarberHandler_GetNearbyBarbers_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	createTestBarberProfile(store) // NYC barber

	req, _ := http.NewRequest("GET", "/api/barbers/nearby?lat=40.7128&lng=-74.0060&radius=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestBarberHandler_GetNearbyBarbers_InvalidLat(t *testing.T) {
	router, _ := setupBarberTestRouter()

	req, _ := http.NewRequest("GET", "/api/barbers/nearby?lat=invalid&lng=-74.0060", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBarberHandler_GetNearbyBarbers_InvalidLng(t *testing.T) {
	router, _ := setupBarberTestRouter()

	req, _ := http.NewRequest("GET", "/api/barbers/nearby?lat=40.7128&lng=invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBarberHandler_GetBarberProfile_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	user, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	profileData := response["profile"].(map[string]interface{})
	assert.Equal(t, "Elite Cuts", profileData["businessName"])
	assert.Equal(t, float64(4.8), profileData["rating"])

	userData := response["user"].(map[string]interface{})
	assert.Equal(t, user.Email, userData["email"])
}

func TestBarberHandler_GetBarberProfile_NotFound(t *testing.T) {
	router, _ := setupBarberTestRouter()

	req, _ := http.NewRequest("GET", "/api/barbers/"+uuid.New().String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestBarberHandler_GetBarberProfile_InvalidID(t *testing.T) {
	router, _ := setupBarberTestRouter()

	req, _ := http.NewRequest("GET", "/api/barbers/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBarberHandler_GetBarberServices_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/services", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	services := response["services"].([]interface{})
	assert.Len(t, services, 2)
}

func TestBarberHandler_GetBarberReviews_Empty(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/reviews", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["total"])
}

func TestBarberHandler_GetBarberReviews_WithReviews(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	// Add some reviews
	for i := 0; i < 5; i++ {
		comment := fmt.Sprintf("Great haircut #%d", i)
		review := &models.Review{
			ID:        uuid.New(),
			BarberID:  profile.ID,
			ClientID:  uuid.New(),
			Rating:    4 + i%2,
			Comment:   &comment,
			CreatedAt: time.Now(),
		}
		store.Reviews[review.ID] = review
	}

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/reviews", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(5), response["total"])
}

func TestBarberHandler_GetBarberAvailability_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	// Get next Monday
	now := time.Now()
	daysUntilMonday := (int(time.Monday) - int(now.Weekday()) + 7) % 7
	if daysUntilMonday == 0 {
		daysUntilMonday = 7
	}
	monday := now.AddDate(0, 0, daysUntilMonday)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/availability?date="+monday.Format("2006-01-02"), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, true, response["available"])
	assert.Equal(t, "monday", response["dayOfWeek"])
}

func TestBarberHandler_GetBarberAvailability_ClosedDay(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	// Get next Sunday
	now := time.Now()
	daysUntilSunday := (int(time.Sunday) - int(now.Weekday()) + 7) % 7
	if daysUntilSunday == 0 {
		daysUntilSunday = 7
	}
	sunday := now.AddDate(0, 0, daysUntilSunday)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/availability?date="+sunday.Format("2006-01-02"), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, false, response["available"])
}

func TestBarberHandler_GetBarberAvailability_InvalidDate(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/availability?date=invalid-date", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBarberHandler_UpdateBarberProfile_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	updateData := map[string]interface{}{
		"bio":         "Updated bio",
		"experience":  15,
		"specialties": []string{"Fade", "Beard Trim", "Hair Color"},
	}
	body, _ := json.Marshal(updateData)

	req, _ := http.NewRequest("PUT", "/api/barbers/"+profile.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.BarberProfile
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Updated bio", *response.Bio)
	assert.Equal(t, 15, response.Experience)
	assert.Len(t, response.Specialties, 3)
}

func TestBarberHandler_UpdateBarberSchedule_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	schedule := map[string]models.WorkingHour{
		"monday": {Start: "08:00", End: "20:00", IsAvailable: true},
		"sunday": {Start: "12:00", End: "18:00", IsAvailable: true}, // Now open on Sunday
	}
	body, _ := json.Marshal(schedule)

	req, _ := http.NewRequest("PUT", "/api/barbers/"+profile.ID.String()+"/schedule", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify update
	assert.Equal(t, "08:00", store.BarberProfiles[profile.ID].WorkingHours["monday"].Start)
	assert.Equal(t, true, store.BarberProfiles[profile.ID].WorkingHours["sunday"].IsAvailable)
}

func TestBarberHandler_UpdateBarberServices_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	services := []models.Service{
		{Name: "Premium Cut", Price: 50.00, Duration: 60},
		{Name: "Quick Trim", Price: 15.00, Duration: 15},
	}
	body, _ := json.Marshal(services)

	req, _ := http.NewRequest("POST", "/api/barbers/"+profile.ID.String()+"/services", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify update
	assert.Len(t, store.BarberProfiles[profile.ID].Services, 2)
	assert.Equal(t, "Premium Cut", store.BarberProfiles[profile.ID].Services[0].Name)
}

func TestBarberHandler_AddGalleryImage_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	imageData := map[string]string{
		"url":  "https://example.com/haircut.jpg",
		"type": "after",
	}
	body, _ := json.Marshal(imageData)

	req, _ := http.NewRequest("POST", "/api/barbers/"+profile.ID.String()+"/gallery", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Len(t, store.BarberProfiles[profile.ID].Gallery, 1)
}

func TestBarberHandler_DeleteGalleryImage_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	// Add an image first
	profile.Gallery = []models.GalleryItem{
		{URL: "https://example.com/image1.jpg", Type: "work"},
		{URL: "https://example.com/image2.jpg", Type: "after"},
	}

	req, _ := http.NewRequest("DELETE", "/api/barbers/"+profile.ID.String()+"/gallery/0", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Len(t, store.BarberProfiles[profile.ID].Gallery, 1)
	assert.Equal(t, "https://example.com/image2.jpg", store.BarberProfiles[profile.ID].Gallery[0].URL)
}

func TestBarberHandler_DeleteGalleryImage_InvalidIndex(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("DELETE", "/api/barbers/"+profile.ID.String()+"/gallery/999", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestBarberHandler_DeleteBarberProfile_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("DELETE", "/api/barbers/"+profile.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	_, exists := store.BarberProfiles[profile.ID]
	assert.False(t, exists)
}

func TestBarberHandler_GetEarnings_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/earnings?period=week", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "week", response["period"])
	assert.NotNil(t, response["totalEarnings"])
	assert.NotNil(t, response["netEarnings"])
}

func TestBarberHandler_GetConnectStatus_NoAccount(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/"+profile.ID.String()+"/connect/status", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, false, response["hasAccount"])
}

func TestBarberHandler_CreateConnectAccount_Success(t *testing.T) {
	router, store := setupBarberTestRouter()
	_, profile := createTestBarberProfile(store)

	req, _ := http.NewRequest("POST", "/api/barbers/"+profile.ID.String()+"/connect", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should succeed with mock response (Stripe not configured in tests)
	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEmpty(t, response["accountId"])
}

func TestBarberHandler_GetBarberProfiles_Legacy(t *testing.T) {
	router, store := setupBarberTestRouter()
	createTestBarberProfile(store)
	createTestBarberProfile(store)

	req, _ := http.NewRequest("GET", "/api/barbers/profiles", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	profiles := response["profiles"].([]interface{})
	assert.Len(t, profiles, 2)
}
