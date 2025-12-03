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

func setupAppointmentTestRouter() (*gin.Engine, *storage.MemoryStorage) {
	gin.SetMode(gin.TestMode)
	store := storage.NewMemoryStorage()
	appointmentHandler := handlers.NewAppointmentHandler(store)

	router := gin.New()

	// Auth middleware simulation for tests
	setUserContext := func(userID string) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		}
	}

	// Public routes (no auth required)
	router.GET("/api/appointments", appointmentHandler.GetAppointments)
	router.GET("/api/appointments/:id", appointmentHandler.GetAppointment)

	// Authenticated routes
	authGroup := router.Group("/api/auth")
	authGroup.POST("/appointments", setUserContext("test-user-id"), appointmentHandler.CreateAppointment)
	authGroup.PUT("/appointments/:id", setUserContext("test-user-id"), appointmentHandler.UpdateAppointment)
	authGroup.DELETE("/appointments/:id", setUserContext("test-user-id"), appointmentHandler.DeleteAppointment)
	authGroup.POST("/appointments/:id/confirm", setUserContext("test-barber-id"), appointmentHandler.ConfirmAppointment)
	authGroup.POST("/appointments/:id/complete", setUserContext("test-barber-id"), appointmentHandler.CompleteAppointment)
	authGroup.POST("/appointments/:id/review", setUserContext("test-user-id"), appointmentHandler.SubmitReview)

	return router, store
}

func createTestClientAndBarber(store *storage.MemoryStorage) (*models.User, *models.User, *models.BarberProfile) {
	// Create client
	clientID := uuid.New()
	client := &models.User{
		ID:    clientID,
		Email: fmt.Sprintf("client-%s@example.com", clientID.String()[:8]),
		Name:  "Test Client",
		Role:  models.RoleClient,
	}
	store.Users[clientID] = client

	// Create barber
	barberID := uuid.New()
	barber := &models.User{
		ID:    barberID,
		Email: fmt.Sprintf("barber-%s@example.com", barberID.String()[:8]),
		Name:  "Test Barber",
		Role:  models.RoleBarber,
	}
	store.Users[barberID] = barber

	// Create barber profile
	businessName := "Test Barber Shop"
	profile := &models.BarberProfile{
		ID:           barberID,
		UserID:       barberID,
		BusinessName: &businessName,
		Rating:       4.5,
		TotalReviews: 10,
		IsVerified:   true,
		WorkingHours: map[string]models.WorkingHour{
			"monday":  {Start: "09:00", End: "18:00", IsAvailable: true},
			"tuesday": {Start: "09:00", End: "18:00", IsAvailable: true},
		},
		Services: []models.Service{
			{Name: "Haircut", Price: 30.00, Duration: 30},
		},
	}
	store.BarberProfiles[barberID] = profile

	return client, barber, profile
}

func createTestAppointment(store *storage.MemoryStorage, clientID, barberID uuid.UUID, status models.AppointmentStatus) *models.Appointment {
	appointment := &models.Appointment{
		ID:          uuid.New(),
		ClientID:    clientID,
		BarberID:    barberID,
		Status:      status,
		ServiceType: "Haircut",
		HairType:    models.HairTypeStraight,
		Location: models.AppointmentLocation{
			Type: models.LocationTypeInSalon,
		},
		ScheduledFor:  time.Now().Add(24 * time.Hour),
		Duration:      30,
		Price:         30.00,
		PaymentStatus: models.PaymentStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	store.Appointments[appointment.ID] = appointment
	return appointment
}

func TestAppointmentHandler_GetAppointments_Empty(t *testing.T) {
	router, _ := setupAppointmentTestRouter()

	req, _ := http.NewRequest("GET", "/api/appointments", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(0), response["total"])
}

func TestAppointmentHandler_GetAppointments_WithData(t *testing.T) {
	router, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)
	createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusConfirmed)

	req, _ := http.NewRequest("GET", "/api/appointments", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(2), response["total"])
}

func TestAppointmentHandler_GetAppointments_FilterByStatus(t *testing.T) {
	router, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)
	createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusConfirmed)

	req, _ := http.NewRequest("GET", "/api/appointments?status=pending", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestAppointmentHandler_GetAppointment_Success(t *testing.T) {
	router, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	req, _ := http.NewRequest("GET", "/api/appointments/"+appointment.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotNil(t, response["appointment"])
	assert.NotNil(t, response["client"])
	assert.NotNil(t, response["barber"])
}

func TestAppointmentHandler_GetAppointment_NotFound(t *testing.T) {
	router, _ := setupAppointmentTestRouter()

	req, _ := http.NewRequest("GET", "/api/appointments/"+uuid.New().String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAppointmentHandler_GetAppointment_InvalidID(t *testing.T) {
	router, _ := setupAppointmentTestRouter()

	req, _ := http.NewRequest("GET", "/api/appointments/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_CreateAppointment_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()

	// Create client and barber
	clientID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
	client := &models.User{ID: clientID, Email: "client@example.com", Name: "Client", Role: models.RoleClient}
	store.Users[clientID] = client

	barberID := uuid.New()
	barber := &models.User{ID: barberID, Email: "barber@example.com", Name: "Barber", Role: models.RoleBarber}
	store.Users[barberID] = barber

	profile := &models.BarberProfile{ID: barberID, UserID: barberID}
	store.BarberProfiles[barberID] = profile

	// Create custom router with the correct user ID
	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments", func(c *gin.Context) {
		c.Set("userID", clientID.String())
		c.Next()
	}, appointmentHandler.CreateAppointment)

	scheduledFor := time.Now().Add(48 * time.Hour).Format(time.RFC3339)
	reqBody := map[string]interface{}{
		"barberId":     barberID.String(),
		"serviceType":  "Haircut",
		"locationType": "in_salon",
		"scheduledFor": scheduledFor,
		"price":        30.00,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/appointments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var appointment models.Appointment
	err := json.Unmarshal(w.Body.Bytes(), &appointment)
	require.NoError(t, err)
	assert.Equal(t, barberID, appointment.BarberID)
	assert.Equal(t, "Haircut", appointment.ServiceType)
	assert.Equal(t, models.AppointmentStatusPending, appointment.Status)
}

func TestAppointmentHandler_CreateAppointment_BarberNotFound(t *testing.T) {
	_, store := setupAppointmentTestRouter()

	clientID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
	client := &models.User{ID: clientID, Email: "client@example.com", Name: "Client", Role: models.RoleClient}
	store.Users[clientID] = client

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments", func(c *gin.Context) {
		c.Set("userID", clientID.String())
		c.Next()
	}, appointmentHandler.CreateAppointment)

	scheduledFor := time.Now().Add(48 * time.Hour).Format(time.RFC3339)
	reqBody := map[string]interface{}{
		"barberId":     uuid.New().String(),
		"serviceType":  "Haircut",
		"locationType": "in_salon",
		"scheduledFor": scheduledFor,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/appointments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAppointmentHandler_CreateAppointment_PastDate(t *testing.T) {
	_, store := setupAppointmentTestRouter()

	clientID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
	client := &models.User{ID: clientID, Email: "client@example.com", Name: "Client", Role: models.RoleClient}
	store.Users[clientID] = client

	barberID := uuid.New()
	store.BarberProfiles[barberID] = &models.BarberProfile{ID: barberID, UserID: barberID}

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments", func(c *gin.Context) {
		c.Set("userID", clientID.String())
		c.Next()
	}, appointmentHandler.CreateAppointment)

	scheduledFor := time.Now().Add(-24 * time.Hour).Format(time.RFC3339) // Past date
	reqBody := map[string]interface{}{
		"barberId":     barberID.String(),
		"serviceType":  "Haircut",
		"locationType": "in_salon",
		"scheduledFor": scheduledFor,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/appointments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "future")
}

func TestAppointmentHandler_UpdateAppointment_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.PUT("/api/appointments/:id", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.UpdateAppointment)

	newScheduledFor := time.Now().Add(72 * time.Hour).Format(time.RFC3339)
	updateBody := map[string]interface{}{
		"scheduledFor":    newScheduledFor,
		"specialRequests": "Please use organic products",
	}
	body, _ := json.Marshal(updateBody)

	req, _ := http.NewRequest("PUT", "/api/appointments/"+appointment.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updatedAppointment models.Appointment
	json.Unmarshal(w.Body.Bytes(), &updatedAppointment)
	assert.Equal(t, "Please use organic products", *updatedAppointment.SpecialRequests)
}

func TestAppointmentHandler_UpdateAppointment_CompletedFails(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusCompleted)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.PUT("/api/appointments/:id", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.UpdateAppointment)

	updateBody := map[string]interface{}{
		"serviceType": "New Service",
	}
	body, _ := json.Marshal(updateBody)

	req, _ := http.NewRequest("PUT", "/api/appointments/"+appointment.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_DeleteAppointment_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.DELETE("/api/appointments/:id", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.DeleteAppointment)

	req, _ := http.NewRequest("DELETE", "/api/appointments/"+appointment.ID.String(), nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify status changed to cancelled
	assert.Equal(t, models.AppointmentStatusCancelled, store.Appointments[appointment.ID].Status)
}

func TestAppointmentHandler_DeleteAppointment_CompletedFails(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusCompleted)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.DELETE("/api/appointments/:id", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.DeleteAppointment)

	req, _ := http.NewRequest("DELETE", "/api/appointments/"+appointment.ID.String(), nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_ConfirmAppointment_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/confirm", func(c *gin.Context) {
		c.Set("userID", barber.ID.String())
		c.Next()
	}, appointmentHandler.ConfirmAppointment)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/confirm", nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, models.AppointmentStatusConfirmed, store.Appointments[appointment.ID].Status)
}

func TestAppointmentHandler_ConfirmAppointment_NotPending(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusConfirmed)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/confirm", func(c *gin.Context) {
		c.Set("userID", barber.ID.String())
		c.Next()
	}, appointmentHandler.ConfirmAppointment)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/confirm", nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_CompleteAppointment_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusConfirmed)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/complete", func(c *gin.Context) {
		c.Set("userID", barber.ID.String())
		c.Next()
	}, appointmentHandler.CompleteAppointment)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/complete", nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, models.AppointmentStatusCompleted, store.Appointments[appointment.ID].Status)
}

func TestAppointmentHandler_CompleteAppointment_NotConfirmed(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/complete", func(c *gin.Context) {
		c.Set("userID", barber.ID.String())
		c.Next()
	}, appointmentHandler.CompleteAppointment)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/complete", nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_SubmitReview_Success(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusCompleted)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/review", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.SubmitReview)

	reviewBody := map[string]interface{}{
		"rating":  5,
		"comment": "Excellent haircut!",
	}
	body, _ := json.Marshal(reviewBody)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/review", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var review models.Review
	json.Unmarshal(w.Body.Bytes(), &review)
	assert.Equal(t, 5, review.Rating)
	assert.Equal(t, "Excellent haircut!", *review.Comment)
}

func TestAppointmentHandler_SubmitReview_NotCompleted(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/review", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.SubmitReview)

	reviewBody := map[string]interface{}{
		"rating": 5,
	}
	body, _ := json.Marshal(reviewBody)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/review", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_SubmitReview_AlreadyReviewed(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusCompleted)

	// Add existing review
	existingReview := &models.Review{
		ID:            uuid.New(),
		AppointmentID: appointment.ID,
		ClientID:      client.ID,
		BarberID:      barber.ID,
		Rating:        4,
	}
	store.Reviews[existingReview.ID] = existingReview

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/review", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.SubmitReview)

	reviewBody := map[string]interface{}{
		"rating": 5,
	}
	body, _ := json.Marshal(reviewBody)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/review", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestAppointmentHandler_SubmitReview_InvalidRating(t *testing.T) {
	_, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)
	appointment := createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusCompleted)

	appointmentHandler := handlers.NewAppointmentHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/appointments/:id/review", func(c *gin.Context) {
		c.Set("userID", client.ID.String())
		c.Next()
	}, appointmentHandler.SubmitReview)

	reviewBody := map[string]interface{}{
		"rating": 6, // Invalid - max is 5
	}
	body, _ := json.Marshal(reviewBody)

	req, _ := http.NewRequest("POST", "/api/appointments/"+appointment.ID.String()+"/review", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAppointmentHandler_Pagination(t *testing.T) {
	router, store := setupAppointmentTestRouter()
	client, barber, _ := createTestClientAndBarber(store)

	// Create 25 appointments
	for i := 0; i < 25; i++ {
		createTestAppointment(store, client.ID, barber.ID, models.AppointmentStatusPending)
	}

	// Get first page
	req, _ := http.NewRequest("GET", "/api/appointments?page=1&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, float64(25), response["total"])
	assert.Equal(t, float64(1), response["page"])
	assert.Equal(t, float64(10), response["limit"])
	assert.Equal(t, float64(3), response["totalPages"])
	appointments := response["appointments"].([]interface{})
	assert.Len(t, appointments, 10)

	// Get second page
	req, _ = http.NewRequest("GET", "/api/appointments?page=2&limit=10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(2), response["page"])
	appointments = response["appointments"].([]interface{})
	assert.Len(t, appointments, 10)

	// Get third page
	req, _ = http.NewRequest("GET", "/api/appointments?page=3&limit=10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(3), response["page"])
	appointments = response["appointments"].([]interface{})
	assert.Len(t, appointments, 5)
}
