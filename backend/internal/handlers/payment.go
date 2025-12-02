package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	storage             *storage.MemoryStorage
	stripeSecretKey     string
	stripeWebhookSecret string
}

func NewPaymentHandler(storage *storage.MemoryStorage) *PaymentHandler {
	return &PaymentHandler{
		storage:             storage,
		stripeSecretKey:     os.Getenv("STRIPE_SECRET_KEY"),
		stripeWebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
	}
}

// PaymentMethod represents a saved payment method
type PaymentMethod struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Type      string    `json:"type"`  // "card", "bank_account"
	Brand     string    `json:"brand"` // "visa", "mastercard", etc.
	Last4     string    `json:"last4"` // Last 4 digits
	ExpMonth  int       `json:"expMonth"`
	ExpYear   int       `json:"expYear"`
	IsDefault bool      `json:"isDefault"`
	StripeID  string    `json:"stripeId"` // Stripe payment method ID
	CreatedAt time.Time `json:"createdAt"`
}

// PaymentIntent represents a payment intent
type PaymentIntent struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"userId"`
	Amount         int64      `json:"amount"` // Amount in cents
	Currency       string     `json:"currency"`
	Status         string     `json:"status"` // pending, succeeded, failed
	ClientSecret   string     `json:"clientSecret"`
	StripeIntentID string     `json:"stripeIntentId"`
	AppointmentID  *uuid.UUID `json:"appointmentId,omitempty"`
	OrderID        *uuid.UUID `json:"orderId,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// In-memory storage for payment methods and intents (in production, use database)
var (
	paymentMethods = make(map[uuid.UUID]*PaymentMethod)
	paymentIntents = make(map[uuid.UUID]*PaymentIntent)
)

// Request types
type CreatePaymentIntentRequest struct {
	Amount        int64  `json:"amount" binding:"required,min=50"` // Minimum $0.50
	Currency      string `json:"currency"`
	AppointmentID string `json:"appointmentId,omitempty"`
	OrderID       string `json:"orderId,omitempty"`
}

type SavePaymentMethodRequest struct {
	PaymentMethodID string `json:"paymentMethodId" binding:"required"`
	SetAsDefault    bool   `json:"setAsDefault"`
}

type RefundRequest struct {
	PaymentIntentID string `json:"paymentIntentId" binding:"required"`
	Amount          *int64 `json:"amount,omitempty"` // Partial refund amount, nil for full refund
	Reason          string `json:"reason,omitempty"`
}

// POST /api/payments/intent - Create payment intent
func (h *PaymentHandler) CreatePaymentIntent(c *gin.Context) {
	var req CreatePaymentIntentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Get user to check for Stripe customer ID
	user, userExists := h.storage.Users[userID]
	if !userExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Default currency
	if req.Currency == "" {
		req.Currency = "usd"
	}

	// Check if Stripe is configured
	if h.stripeSecretKey == "" {
		// Return mock response for development
		intent := &PaymentIntent{
			ID:             uuid.New(),
			UserID:         userID,
			Amount:         req.Amount,
			Currency:       req.Currency,
			Status:         "requires_payment_method",
			ClientSecret:   "pi_mock_" + uuid.New().String() + "_secret_" + uuid.New().String()[:8],
			StripeIntentID: "pi_mock_" + uuid.New().String()[:24],
			CreatedAt:      time.Now(),
		}

		if req.AppointmentID != "" {
			appointmentID, _ := uuid.Parse(req.AppointmentID)
			intent.AppointmentID = &appointmentID
		}
		if req.OrderID != "" {
			orderID, _ := uuid.Parse(req.OrderID)
			intent.OrderID = &orderID
		}

		paymentIntents[intent.ID] = intent

		c.JSON(http.StatusOK, gin.H{
			"clientSecret": intent.ClientSecret,
			"intentId":     intent.StripeIntentID,
			"id":           intent.ID,
			"amount":       intent.Amount,
			"currency":     intent.Currency,
			"_mock":        true,
			"_message":     "This is a mock response. Configure STRIPE_SECRET_KEY for real payments.",
		})
		return
	}

	// TODO: Create real Stripe PaymentIntent using stripe-go SDK
	// Example implementation with stripe-go:
	/*
		stripe.Key = h.stripeSecretKey

		params := &stripe.PaymentIntentParams{
			Amount:   stripe.Int64(req.Amount),
			Currency: stripe.String(req.Currency),
			AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
				Enabled: stripe.Bool(true),
			},
		}

		if user.StripeCustomerID != nil {
			params.Customer = stripe.String(*user.StripeCustomerID)
		}

		pi, err := paymentintent.New(params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"clientSecret": pi.ClientSecret,
			"intentId":     pi.ID,
		})
	*/

	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Stripe integration not fully configured",
		"message": "Add stripe-go dependency and implement PaymentIntent creation",
		"user":    user.Email,
	})
}

// POST /api/payments/methods - Save payment method
func (h *PaymentHandler) SavePaymentMethod(c *gin.Context) {
	var req SavePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check if Stripe is configured
	if h.stripeSecretKey == "" {
		// Create mock payment method
		method := &PaymentMethod{
			ID:        uuid.New(),
			UserID:    userID,
			Type:      "card",
			Brand:     "visa",
			Last4:     "4242",
			ExpMonth:  12,
			ExpYear:   2030,
			IsDefault: req.SetAsDefault,
			StripeID:  req.PaymentMethodID,
			CreatedAt: time.Now(),
		}

		// If setting as default, unset others
		if req.SetAsDefault {
			for _, pm := range paymentMethods {
				if pm.UserID == userID {
					pm.IsDefault = false
				}
			}
		}

		paymentMethods[method.ID] = method

		c.JSON(http.StatusCreated, gin.H{
			"paymentMethod": method,
			"_mock":         true,
			"_message":      "This is a mock response. Configure STRIPE_SECRET_KEY for real payments.",
		})
		return
	}

	// TODO: Attach payment method to customer using stripe-go
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Stripe integration not fully configured",
		"message": "Add stripe-go dependency and implement payment method attachment",
	})
}

// GET /api/payments/methods - List saved payment methods
func (h *PaymentHandler) GetPaymentMethods(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Get user's payment methods
	methods := make([]*PaymentMethod, 0)
	for _, method := range paymentMethods {
		if method.UserID == userID {
			methods = append(methods, method)
		}
	}

	// Sort by creation date, default first
	sort.Slice(methods, func(i, j int) bool {
		if methods[i].IsDefault != methods[j].IsDefault {
			return methods[i].IsDefault
		}
		return methods[i].CreatedAt.After(methods[j].CreatedAt)
	})

	c.JSON(http.StatusOK, gin.H{
		"paymentMethods": methods,
		"total":          len(methods),
	})
}

// DELETE /api/payments/methods/:id - Delete payment method
func (h *PaymentHandler) DeletePaymentMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method ID"})
		return
	}

	method, exists := paymentMethods[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if method.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete another user's payment method"})
			return
		}
	}

	delete(paymentMethods, id)

	c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
}

// PUT /api/payments/methods/:id/default - Set default payment method
func (h *PaymentHandler) SetDefaultPaymentMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method ID"})
		return
	}

	method, exists := paymentMethods[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	var userID uuid.UUID
	if userIDStr != nil {
		userID, _ = uuid.Parse(userIDStr.(string))
		if method.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify another user's payment method"})
			return
		}
	}

	// Unset all other defaults for this user
	for _, pm := range paymentMethods {
		if pm.UserID == userID {
			pm.IsDefault = false
		}
	}

	method.IsDefault = true

	c.JSON(http.StatusOK, gin.H{
		"message":       "Default payment method updated",
		"paymentMethod": method,
	})
}

// POST /api/payments/refund - Refund a payment
func (h *PaymentHandler) RefundPayment(c *gin.Context) {
	var req RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if Stripe is configured
	if h.stripeSecretKey == "" {
		c.JSON(http.StatusOK, gin.H{
			"message":  "Refund processed successfully (mock)",
			"refundId": "re_mock_" + uuid.New().String()[:24],
			"amount":   req.Amount,
			"reason":   req.Reason,
			"_mock":    true,
			"_message": "This is a mock response. Configure STRIPE_SECRET_KEY for real refunds.",
		})
		return
	}

	// TODO: Process refund using stripe-go
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Stripe integration not fully configured",
		"message": "Add stripe-go dependency and implement refund processing",
	})
}

// POST /api/webhooks/stripe - Handle Stripe webhook events
func (h *PaymentHandler) HandleStripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error reading request body"})
		return
	}

	// In production, verify webhook signature
	if h.stripeWebhookSecret != "" {
		sigHeader := c.GetHeader("Stripe-Signature")
		if sigHeader == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Stripe-Signature header"})
			return
		}

		// TODO: Verify signature using stripe-go
		// event, err := webhook.ConstructEvent(payload, sigHeader, h.stripeWebhookSecret)
		// if err != nil {
		//     c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		//     return
		// }
	}

	// Parse the event
	var event struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(payload, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing webhook payload"})
		return
	}

	// Handle different event types
	switch event.Type {
	case "payment_intent.succeeded":
		h.handlePaymentIntentSucceeded(c, event.Data)

	case "payment_intent.payment_failed":
		h.handlePaymentIntentFailed(c, event.Data)

	case "customer.created":
		h.handleCustomerCreated(c, event.Data)

	case "charge.refunded":
		h.handleChargeRefunded(c, event.Data)

	case "payment_method.attached":
		h.handlePaymentMethodAttached(c, event.Data)

	case "payment_method.detached":
		h.handlePaymentMethodDetached(c, event.Data)

	default:
		// Log unhandled event types
		c.JSON(http.StatusOK, gin.H{"received": true, "type": event.Type})
		return
	}
}

func (h *PaymentHandler) handlePaymentIntentSucceeded(c *gin.Context, data json.RawMessage) {
	var intent struct {
		Object struct {
			ID       string `json:"id"`
			Amount   int64  `json:"amount"`
			Metadata struct {
				AppointmentID string `json:"appointmentId"`
				OrderID       string `json:"orderId"`
			} `json:"metadata"`
		} `json:"object"`
	}

	if err := json.Unmarshal(data, &intent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payment intent"})
		return
	}

	// Update appointment payment status if applicable
	if intent.Object.Metadata.AppointmentID != "" {
		appointmentID, err := uuid.Parse(intent.Object.Metadata.AppointmentID)
		if err == nil {
			if appointment, exists := h.storage.Appointments[appointmentID]; exists {
				appointment.PaymentStatus = models.PaymentStatusCompleted
				appointment.PaymentID = &intent.Object.ID
				appointment.UpdatedAt = time.Now()
			}
		}
	}

	// Update order payment status if applicable
	if intent.Object.Metadata.OrderID != "" {
		orderID, err := uuid.Parse(intent.Object.Metadata.OrderID)
		if err == nil {
			if order, exists := h.storage.Orders[orderID]; exists {
				order.Status = models.OrderStatusPaid
				order.PaymentID = &intent.Object.ID
				order.UpdatedAt = time.Now()
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_intent.succeeded"})
}

func (h *PaymentHandler) handlePaymentIntentFailed(c *gin.Context, data json.RawMessage) {
	var intent struct {
		Object struct {
			ID       string `json:"id"`
			Metadata struct {
				AppointmentID string `json:"appointmentId"`
				OrderID       string `json:"orderId"`
			} `json:"metadata"`
		} `json:"object"`
	}

	if err := json.Unmarshal(data, &intent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payment intent"})
		return
	}

	// Update appointment payment status if applicable
	if intent.Object.Metadata.AppointmentID != "" {
		appointmentID, err := uuid.Parse(intent.Object.Metadata.AppointmentID)
		if err == nil {
			if appointment, exists := h.storage.Appointments[appointmentID]; exists {
				appointment.PaymentStatus = models.PaymentStatusFailed
				appointment.UpdatedAt = time.Now()
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_intent.payment_failed"})
}

func (h *PaymentHandler) handleCustomerCreated(c *gin.Context, data json.RawMessage) {
	var customer struct {
		Object struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		} `json:"object"`
	}

	if err := json.Unmarshal(data, &customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing customer"})
		return
	}

	// Update user with Stripe customer ID
	for _, user := range h.storage.Users {
		if user.Email == customer.Object.Email {
			user.StripeCustomerID = &customer.Object.ID
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "customer.created"})
}

func (h *PaymentHandler) handleChargeRefunded(c *gin.Context, data json.RawMessage) {
	// Handle refund event
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "charge.refunded"})
}

func (h *PaymentHandler) handlePaymentMethodAttached(c *gin.Context, data json.RawMessage) {
	// Handle payment method attachment
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_method.attached"})
}

func (h *PaymentHandler) handlePaymentMethodDetached(c *gin.Context, data json.RawMessage) {
	// Handle payment method detachment
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_method.detached"})
}

// GET /api/payments/history - Get payment history
func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Get user's payment intents
	intents := make([]*PaymentIntent, 0)
	for _, intent := range paymentIntents {
		if intent.UserID == userID {
			intents = append(intents, intent)
		}
	}

	// Sort by creation date descending
	sort.Slice(intents, func(i, j int) bool {
		return intents[i].CreatedAt.After(intents[j].CreatedAt)
	})

	// Paginate
	total := len(intents)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"payments":   intents[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}
