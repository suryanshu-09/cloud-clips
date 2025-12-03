package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/services"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

type PaymentHandler struct {
	storage       *storage.MemoryStorage
	stripeService *services.StripeService
}

func NewPaymentHandler(storage *storage.MemoryStorage) *PaymentHandler {
	secretKey := os.Getenv("STRIPE_SECRET_KEY")
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")

	return &PaymentHandler{
		storage:       storage,
		stripeService: services.NewStripeService(secretKey, webhookSecret),
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
	if !h.stripeService.IsConfigured() {
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

	// Build metadata for the payment intent
	metadata := map[string]string{
		"userId": userID.String(),
	}
	if req.AppointmentID != "" {
		metadata["appointmentId"] = req.AppointmentID
	}
	if req.OrderID != "" {
		metadata["orderId"] = req.OrderID
	}

	// Create real Stripe PaymentIntent
	params := services.CreatePaymentIntentParams{
		Amount:      req.Amount,
		Currency:    req.Currency,
		Description: "Cloud Clips Payment",
		Metadata:    metadata,
	}

	// Use customer ID if available
	if user.StripeCustomerID != nil && *user.StripeCustomerID != "" {
		params.CustomerID = *user.StripeCustomerID
	}

	pi, err := h.stripeService.CreatePaymentIntent(context.Background(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment intent: " + err.Error()})
		return
	}

	// Store the payment intent locally
	intent := &PaymentIntent{
		ID:             uuid.New(),
		UserID:         userID,
		Amount:         req.Amount,
		Currency:       req.Currency,
		Status:         string(pi.Status),
		ClientSecret:   pi.ClientSecret,
		StripeIntentID: pi.ID,
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
		"clientSecret": pi.ClientSecret,
		"intentId":     pi.ID,
		"id":           intent.ID,
		"amount":       intent.Amount,
		"currency":     intent.Currency,
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

	// Get user
	user, userExists := h.storage.Users[userID]
	if !userExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if Stripe is configured
	if !h.stripeService.IsConfigured() {
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

	// Create Stripe customer if needed
	if user.StripeCustomerID == nil || *user.StripeCustomerID == "" {
		customer, err := h.stripeService.CreateCustomer(context.Background(), user.Email, user.Name, map[string]string{
			"userId": userID.String(),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Stripe customer: " + err.Error()})
			return
		}
		user.StripeCustomerID = &customer.ID
	}

	// Attach payment method to customer
	pm, err := h.stripeService.AttachPaymentMethod(context.Background(), req.PaymentMethodID, *user.StripeCustomerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to attach payment method: " + err.Error()})
		return
	}

	// Set as default if requested
	if req.SetAsDefault {
		_, err := h.stripeService.SetDefaultPaymentMethod(context.Background(), *user.StripeCustomerID, req.PaymentMethodID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default payment method: " + err.Error()})
			return
		}

		// Unset other defaults locally
		for _, localPm := range paymentMethods {
			if localPm.UserID == userID {
				localPm.IsDefault = false
			}
		}
	}

	// Store locally
	method := &PaymentMethod{
		ID:        uuid.New(),
		UserID:    userID,
		Type:      string(pm.Type),
		Brand:     string(pm.Card.Brand),
		Last4:     pm.Card.Last4,
		ExpMonth:  int(pm.Card.ExpMonth),
		ExpYear:   int(pm.Card.ExpYear),
		IsDefault: req.SetAsDefault,
		StripeID:  pm.ID,
		CreatedAt: time.Now(),
	}

	paymentMethods[method.ID] = method

	c.JSON(http.StatusCreated, gin.H{
		"paymentMethod": method,
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

	// Get user
	user, userExists := h.storage.Users[userID]
	if !userExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// If Stripe is configured and user has customer ID, fetch from Stripe
	if h.stripeService.IsConfigured() && user.StripeCustomerID != nil && *user.StripeCustomerID != "" {
		stripeMethods, err := h.stripeService.ListPaymentMethods(context.Background(), *user.StripeCustomerID, "card")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods: " + err.Error()})
			return
		}

		methods := make([]*PaymentMethod, 0, len(stripeMethods))
		for _, pm := range stripeMethods {
			method := &PaymentMethod{
				ID:        uuid.New(), // Generate local ID
				UserID:    userID,
				Type:      string(pm.Type),
				Brand:     string(pm.Card.Brand),
				Last4:     pm.Card.Last4,
				ExpMonth:  int(pm.Card.ExpMonth),
				ExpYear:   int(pm.Card.ExpYear),
				IsDefault: false, // Would need to check customer's default
				StripeID:  pm.ID,
				CreatedAt: time.Unix(pm.Created, 0),
			}
			methods = append(methods, method)
		}

		c.JSON(http.StatusOK, gin.H{
			"paymentMethods": methods,
			"total":          len(methods),
		})
		return
	}

	// Get user's payment methods from local storage
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

	// If Stripe is configured, detach from Stripe
	if h.stripeService.IsConfigured() && method.StripeID != "" {
		_, err := h.stripeService.DetachPaymentMethod(context.Background(), method.StripeID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to detach payment method: " + err.Error()})
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

	// If Stripe is configured, update in Stripe
	if h.stripeService.IsConfigured() {
		user, exists := h.storage.Users[userID]
		if exists && user.StripeCustomerID != nil && *user.StripeCustomerID != "" {
			_, err := h.stripeService.SetDefaultPaymentMethod(context.Background(), *user.StripeCustomerID, method.StripeID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default payment method: " + err.Error()})
				return
			}
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
	if !h.stripeService.IsConfigured() {
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

	// Create refund params
	params := services.CreateRefundParams{
		PaymentIntentID: req.PaymentIntentID,
		Reason:          req.Reason,
	}
	if req.Amount != nil {
		params.Amount = *req.Amount
	}

	refund, err := h.stripeService.CreateRefund(context.Background(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Refund processed successfully",
		"refundId": refund.ID,
		"amount":   refund.Amount,
		"status":   refund.Status,
	})
}

// POST /api/webhooks/stripe - Handle Stripe webhook events
func (h *PaymentHandler) HandleStripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error reading request body"})
		return
	}

	webhookSecret := h.stripeService.GetWebhookSecret()

	var event stripe.Event

	// Verify webhook signature in production
	if webhookSecret != "" {
		sigHeader := c.GetHeader("Stripe-Signature")
		if sigHeader == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Stripe-Signature header"})
			return
		}

		event, err = webhook.ConstructEvent(payload, sigHeader, webhookSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature: " + err.Error()})
			return
		}
	} else {
		// Parse the event without verification (dev mode only)
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing webhook payload"})
			return
		}
	}

	// Handle different event types
	switch event.Type {
	case "payment_intent.succeeded":
		h.handlePaymentIntentSucceeded(c, event)

	case "payment_intent.payment_failed":
		h.handlePaymentIntentFailed(c, event)

	case "customer.created":
		h.handleCustomerCreated(c, event)

	case "charge.refunded":
		h.handleChargeRefunded(c, event)

	case "payment_method.attached":
		h.handlePaymentMethodAttached(c, event)

	case "payment_method.detached":
		h.handlePaymentMethodDetached(c, event)

	// Stripe Connect webhook events
	case "account.updated":
		h.handleAccountUpdated(c, event)

	case "account.application.deauthorized":
		h.handleAccountDeauthorized(c, event)

	case "capability.updated":
		h.handleCapabilityUpdated(c, event)

	case "payout.paid":
		h.handlePayoutPaid(c, event)

	case "payout.failed":
		h.handlePayoutFailed(c, event)

	case "transfer.created":
		h.handleTransferCreated(c, event)

	case "transfer.reversed":
		h.handleTransferReversed(c, event)

	default:
		// Log unhandled event types
		c.JSON(http.StatusOK, gin.H{"received": true, "type": event.Type})
		return
	}
}

func (h *PaymentHandler) handlePaymentIntentSucceeded(c *gin.Context, event stripe.Event) {
	var paymentIntent stripe.PaymentIntent
	if err := json.Unmarshal(event.Data.Raw, &paymentIntent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payment intent"})
		return
	}

	// Update appointment payment status if applicable
	if appointmentIDStr, ok := paymentIntent.Metadata["appointmentId"]; ok && appointmentIDStr != "" {
		appointmentID, err := uuid.Parse(appointmentIDStr)
		if err == nil {
			if appointment, exists := h.storage.Appointments[appointmentID]; exists {
				appointment.PaymentStatus = models.PaymentStatusCompleted
				paymentID := paymentIntent.ID
				appointment.PaymentID = &paymentID
				appointment.UpdatedAt = time.Now()
			}
		}
	}

	// Update order payment status if applicable
	if orderIDStr, ok := paymentIntent.Metadata["orderId"]; ok && orderIDStr != "" {
		orderID, err := uuid.Parse(orderIDStr)
		if err == nil {
			if order, exists := h.storage.Orders[orderID]; exists {
				order.Status = models.OrderStatusPaid
				paymentID := paymentIntent.ID
				order.PaymentID = &paymentID
				order.UpdatedAt = time.Now()
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_intent.succeeded"})
}

func (h *PaymentHandler) handlePaymentIntentFailed(c *gin.Context, event stripe.Event) {
	var paymentIntent stripe.PaymentIntent
	if err := json.Unmarshal(event.Data.Raw, &paymentIntent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payment intent"})
		return
	}

	// Update appointment payment status if applicable
	if appointmentIDStr, ok := paymentIntent.Metadata["appointmentId"]; ok && appointmentIDStr != "" {
		appointmentID, err := uuid.Parse(appointmentIDStr)
		if err == nil {
			if appointment, exists := h.storage.Appointments[appointmentID]; exists {
				appointment.PaymentStatus = models.PaymentStatusFailed
				appointment.UpdatedAt = time.Now()
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_intent.payment_failed"})
}

func (h *PaymentHandler) handleCustomerCreated(c *gin.Context, event stripe.Event) {
	var customer stripe.Customer
	if err := json.Unmarshal(event.Data.Raw, &customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing customer"})
		return
	}

	// Update user with Stripe customer ID
	for _, user := range h.storage.Users {
		if user.Email == customer.Email {
			user.StripeCustomerID = &customer.ID
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "customer.created"})
}

func (h *PaymentHandler) handleChargeRefunded(c *gin.Context, event stripe.Event) {
	// Handle refund event - update order/appointment status as needed
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "charge.refunded"})
}

func (h *PaymentHandler) handlePaymentMethodAttached(c *gin.Context, event stripe.Event) {
	// Handle payment method attachment - sync with local storage if needed
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payment_method.attached"})
}

func (h *PaymentHandler) handlePaymentMethodDetached(c *gin.Context, event stripe.Event) {
	// Handle payment method detachment - remove from local storage if needed
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

// ============================================
// STRIPE CONNECT WEBHOOK HANDLERS
// ============================================

// handleAccountUpdated handles account.updated events from Stripe Connect
func (h *PaymentHandler) handleAccountUpdated(c *gin.Context, event stripe.Event) {
	var account stripe.Account
	if err := json.Unmarshal(event.Data.Raw, &account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing account"})
		return
	}

	// Find barber by Connect account ID and update status
	for _, profile := range h.storage.BarberProfiles {
		if profile.StripeConnectID != nil && *profile.StripeConnectID == account.ID {
			profile.ChargesEnabled = account.ChargesEnabled
			profile.PayoutsEnabled = account.PayoutsEnabled
			profile.UpdatedAt = time.Now()

			// Update Connect status based on account state
			if account.ChargesEnabled && account.PayoutsEnabled && account.DetailsSubmitted {
				profile.StripeConnectStatus = models.ConnectStatusVerified
				if profile.ConnectOnboardedAt == nil {
					now := time.Now()
					profile.ConnectOnboardedAt = &now
				}
			} else if len(account.Requirements.CurrentlyDue) > 0 || len(account.Requirements.PastDue) > 0 {
				profile.StripeConnectStatus = models.ConnectStatusPending
			} else if account.Requirements.DisabledReason != "" {
				profile.StripeConnectStatus = models.ConnectStatusRestricted
			}
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "account.updated"})
}

// handleAccountDeauthorized handles account.application.deauthorized events
func (h *PaymentHandler) handleAccountDeauthorized(c *gin.Context, event stripe.Event) {
	var account stripe.Account
	if err := json.Unmarshal(event.Data.Raw, &account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing account"})
		return
	}

	// Find barber by Connect account ID and mark as disabled
	for _, profile := range h.storage.BarberProfiles {
		if profile.StripeConnectID != nil && *profile.StripeConnectID == account.ID {
			profile.StripeConnectStatus = models.ConnectStatusDisabled
			profile.ChargesEnabled = false
			profile.PayoutsEnabled = false
			profile.UpdatedAt = time.Now()
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "account.application.deauthorized"})
}

// handleCapabilityUpdated handles capability.updated events
func (h *PaymentHandler) handleCapabilityUpdated(c *gin.Context, event stripe.Event) {
	// Capability updates are typically followed by account.updated
	// This handler is for logging/tracking specific capability changes
	c.JSON(http.StatusOK, gin.H{"received": true, "type": "capability.updated"})
}

// handlePayoutPaid handles payout.paid events
func (h *PaymentHandler) handlePayoutPaid(c *gin.Context, event stripe.Event) {
	var payout stripe.Payout
	if err := json.Unmarshal(event.Data.Raw, &payout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payout"})
		return
	}

	// Log successful payout - in production, you might want to:
	// - Send notification to barber
	// - Update payout history
	// - Trigger analytics event

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payout.paid", "payoutId": payout.ID})
}

// handlePayoutFailed handles payout.failed events
func (h *PaymentHandler) handlePayoutFailed(c *gin.Context, event stripe.Event) {
	var payout stripe.Payout
	if err := json.Unmarshal(event.Data.Raw, &payout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing payout"})
		return
	}

	// Handle failed payout - in production, you might want to:
	// - Send notification to barber about the failure
	// - Log the failure reason
	// - Update barber's payout status

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "payout.failed", "payoutId": payout.ID, "failureCode": payout.FailureCode})
}

// handleTransferCreated handles transfer.created events
func (h *PaymentHandler) handleTransferCreated(c *gin.Context, event stripe.Event) {
	var transfer stripe.Transfer
	if err := json.Unmarshal(event.Data.Raw, &transfer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing transfer"})
		return
	}

	// Track transfer creation - useful for:
	// - Updating barber earnings dashboard
	// - Analytics tracking
	// - Reconciliation

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "transfer.created", "transferId": transfer.ID})
}

// handleTransferReversed handles transfer.reversed events
func (h *PaymentHandler) handleTransferReversed(c *gin.Context, event stripe.Event) {
	var transfer stripe.Transfer
	if err := json.Unmarshal(event.Data.Raw, &transfer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing transfer"})
		return
	}

	// Handle transfer reversal - typically happens when:
	// - A refund is issued for a payment that had a connected transfer
	// - Manual reversal via dashboard

	c.JSON(http.StatusOK, gin.H{"received": true, "type": "transfer.reversed", "transferId": transfer.ID})
}
