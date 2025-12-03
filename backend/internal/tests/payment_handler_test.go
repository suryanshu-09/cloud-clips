package tests

import (
	"bytes"
	"encoding/json"
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

func setupPaymentTestRouter() (*gin.Engine, *storage.MemoryStorage, *handlers.PaymentHandler) {
	gin.SetMode(gin.TestMode)
	store := storage.NewMemoryStorage()
	paymentHandler := handlers.NewPaymentHandler(store)

	router := gin.New()
	return router, store, paymentHandler
}

func createTestUserForPayment(store *storage.MemoryStorage) *models.User {
	user := &models.User{
		ID:        uuid.New(),
		Email:     "testuser@example.com",
		Name:      "Test User",
		Role:      models.RoleClient,
		CreatedAt: time.Now(),
	}
	store.Users[user.ID] = user
	return user
}

// ==================== CreatePaymentIntent Tests ====================

func TestPaymentHandler_CreatePaymentIntent_Success(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount":   5000, // $50.00
		"currency": "usd",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEmpty(t, response["clientSecret"])
	assert.NotEmpty(t, response["intentId"])
	assert.Equal(t, float64(5000), response["amount"])
	assert.Equal(t, "usd", response["currency"])
	// Should be mock since Stripe not configured
	assert.Equal(t, true, response["_mock"])
}

func TestPaymentHandler_CreatePaymentIntent_DefaultCurrency(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount": 1000,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "usd", response["currency"])
}

func TestPaymentHandler_CreatePaymentIntent_WithAppointmentID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)
	appointmentID := uuid.New()

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount":        2500,
		"appointmentId": appointmentID.String(),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestPaymentHandler_CreatePaymentIntent_WithOrderID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)
	orderID := uuid.New()

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount":  3500,
		"orderId": orderID.String(),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestPaymentHandler_CreatePaymentIntent_MinimumAmount(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount": 10, // Below minimum of 50 cents
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPaymentHandler_CreatePaymentIntent_Unauthenticated(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()

	router := gin.New()
	router.POST("/api/payments/intent", paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount": 1000,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestPaymentHandler_CreatePaymentIntent_UserNotFound(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()
	nonExistentUserID := uuid.New()

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", nonExistentUserID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)

	reqBody := map[string]interface{}{
		"amount": 1000,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ==================== SavePaymentMethod Tests ====================

func TestPaymentHandler_SavePaymentMethod_Success(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SavePaymentMethod)

	reqBody := map[string]interface{}{
		"paymentMethodId": "pm_test_1234567890",
		"setAsDefault":    true,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/methods", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	pm := response["paymentMethod"].(map[string]interface{})
	assert.Equal(t, "visa", pm["brand"])
	assert.Equal(t, "4242", pm["last4"])
	assert.Equal(t, true, pm["isDefault"])
}

func TestPaymentHandler_SavePaymentMethod_NotDefault(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SavePaymentMethod)

	reqBody := map[string]interface{}{
		"paymentMethodId": "pm_test_1234567890",
		"setAsDefault":    false,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/methods", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	pm := response["paymentMethod"].(map[string]interface{})
	assert.Equal(t, false, pm["isDefault"])
}

func TestPaymentHandler_SavePaymentMethod_MissingPaymentMethodID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SavePaymentMethod)

	reqBody := map[string]interface{}{
		"setAsDefault": true,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/methods", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPaymentHandler_SavePaymentMethod_UserNotFound(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()
	nonExistentUserID := uuid.New()

	router := gin.New()
	router.POST("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", nonExistentUserID.String())
		c.Next()
	}, paymentHandler.SavePaymentMethod)

	reqBody := map[string]interface{}{
		"paymentMethodId": "pm_test_1234567890",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/methods", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ==================== GetPaymentMethods Tests ====================

func TestPaymentHandler_GetPaymentMethods_Empty(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.GET("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.GetPaymentMethods)

	req, _ := http.NewRequest("GET", "/api/payments/methods", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["total"])
}

func TestPaymentHandler_GetPaymentMethods_UserNotFound(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()
	nonExistentUserID := uuid.New()

	router := gin.New()
	router.GET("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", nonExistentUserID.String())
		c.Next()
	}, paymentHandler.GetPaymentMethods)

	req, _ := http.NewRequest("GET", "/api/payments/methods", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ==================== DeletePaymentMethod Tests ====================

func TestPaymentHandler_DeletePaymentMethod_InvalidID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.DELETE("/api/payments/methods/:id", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.DeletePaymentMethod)

	req, _ := http.NewRequest("DELETE", "/api/payments/methods/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPaymentHandler_DeletePaymentMethod_NotFound(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.DELETE("/api/payments/methods/:id", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.DeletePaymentMethod)

	req, _ := http.NewRequest("DELETE", "/api/payments/methods/"+uuid.New().String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ==================== SetDefaultPaymentMethod Tests ====================

func TestPaymentHandler_SetDefaultPaymentMethod_InvalidID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.PUT("/api/payments/methods/:id/default", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SetDefaultPaymentMethod)

	req, _ := http.NewRequest("PUT", "/api/payments/methods/invalid-uuid/default", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPaymentHandler_SetDefaultPaymentMethod_NotFound(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.PUT("/api/payments/methods/:id/default", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SetDefaultPaymentMethod)

	req, _ := http.NewRequest("PUT", "/api/payments/methods/"+uuid.New().String()+"/default", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ==================== RefundPayment Tests ====================

func TestPaymentHandler_RefundPayment_MockSuccess(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/refund", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.RefundPayment)

	reqBody := map[string]interface{}{
		"paymentIntentId": "pi_test_1234567890",
		"reason":          "Customer requested refund",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/refund", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["message"], "Refund processed")
	assert.NotEmpty(t, response["refundId"])
	assert.Equal(t, true, response["_mock"])
}

func TestPaymentHandler_RefundPayment_PartialRefund(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/refund", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.RefundPayment)

	reqBody := map[string]interface{}{
		"paymentIntentId": "pi_test_1234567890",
		"amount":          1000, // Partial refund of $10.00
		"reason":          "Partial refund",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/refund", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestPaymentHandler_RefundPayment_MissingPaymentIntentID(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/refund", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.RefundPayment)

	reqBody := map[string]interface{}{
		"reason": "No intent ID",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/refund", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ==================== GetPaymentHistory Tests ====================

func TestPaymentHandler_GetPaymentHistory_Empty(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.GET("/api/payments/history", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.GetPaymentHistory)

	req, _ := http.NewRequest("GET", "/api/payments/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["total"])
}

func TestPaymentHandler_GetPaymentHistory_Pagination(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.GET("/api/payments/history", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.GetPaymentHistory)

	req, _ := http.NewRequest("GET", "/api/payments/history?page=1&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["page"])
	assert.Equal(t, float64(10), response["limit"])
}

func TestPaymentHandler_GetPaymentHistory_Unauthenticated(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()

	router := gin.New()
	router.GET("/api/payments/history", paymentHandler.GetPaymentHistory)

	req, _ := http.NewRequest("GET", "/api/payments/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// ==================== Stripe Webhook Tests ====================

func TestPaymentHandler_HandleStripeWebhook_UnhandledEvent(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()

	router := gin.New()
	router.POST("/api/webhooks/stripe", paymentHandler.HandleStripeWebhook)

	webhookBody := map[string]interface{}{
		"type": "unknown.event.type",
		"data": map[string]interface{}{
			"object": map[string]interface{}{},
		},
	}
	body, _ := json.Marshal(webhookBody)

	req, _ := http.NewRequest("POST", "/api/webhooks/stripe", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, true, response["received"])
}

func TestPaymentHandler_HandleStripeWebhook_InvalidJSON(t *testing.T) {
	_, _, paymentHandler := setupPaymentTestRouter()

	router := gin.New()
	router.POST("/api/webhooks/stripe", paymentHandler.HandleStripeWebhook)

	req, _ := http.NewRequest("POST", "/api/webhooks/stripe", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ==================== Integration Tests ====================

func TestPaymentHandler_CreateIntentAndTrackHistory(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/intent", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.CreatePaymentIntent)
	router.GET("/api/payments/history", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.GetPaymentHistory)

	// Create a payment intent
	reqBody := map[string]interface{}{
		"amount": 5000,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/intent", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	// Check payment history has the new intent
	req, _ = http.NewRequest("GET", "/api/payments/history", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestPaymentHandler_SaveAndListPaymentMethods(t *testing.T) {
	_, store, paymentHandler := setupPaymentTestRouter()
	user := createTestUserForPayment(store)

	router := gin.New()
	router.POST("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.SavePaymentMethod)
	router.GET("/api/payments/methods", func(c *gin.Context) {
		c.Set("userID", user.ID.String())
		c.Next()
	}, paymentHandler.GetPaymentMethods)

	// Save a payment method
	reqBody := map[string]interface{}{
		"paymentMethodId": "pm_test_1234567890",
		"setAsDefault":    true,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/payments/methods", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)

	// List payment methods
	req, _ = http.NewRequest("GET", "/api/payments/methods", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}
