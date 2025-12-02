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

type OrderHandler struct {
	storage *storage.MemoryStorage
}

func NewOrderHandler(storage *storage.MemoryStorage) *OrderHandler {
	return &OrderHandler{storage: storage}
}

// Request types
type CreateOrderRequest struct {
	Items           []OrderItemRequest `json:"items" binding:"required,min=1"`
	ShippingAddress models.Address     `json:"shippingAddress" binding:"required"`
	CouponCode      string             `json:"couponCode"`
}

type OrderItemRequest struct {
	ProductID string `json:"productId" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"` // pending, paid, shipped, delivered, cancelled
}

// GET /api/orders - List user's orders
func (h *OrderHandler) GetOrders(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")

	// Query parameters
	status := c.Query("status")
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

	orders := make([]*models.Order, 0)
	for _, order := range h.storage.Orders {
		// Filter by user if authenticated
		if exists && userIDStr != nil && order.UserID != userID {
			continue
		}

		// Filter by status
		if status != "" && string(order.Status) != status {
			continue
		}

		orders = append(orders, order)
	}

	// Sort by creation date descending
	sort.Slice(orders, func(i, j int) bool {
		return orders[i].CreatedAt.After(orders[j].CreatedAt)
	})

	// Paginate
	total := len(orders)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"orders":     orders[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}

// POST /api/orders - Create order
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
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

	// Build order items and calculate total
	var totalAmount float64
	orderItems := make([]models.OrderItem, 0, len(req.Items))

	for _, item := range req.Items {
		productID, err := uuid.Parse(item.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID: " + item.ProductID})
			return
		}

		product, exists := h.storage.Products[productID]
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found: " + item.ProductID})
			return
		}

		// Check stock
		if product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":     "Insufficient stock",
				"productId": item.ProductID,
				"available": product.Stock,
				"requested": item.Quantity,
			})
			return
		}

		itemTotal := product.Price * float64(item.Quantity)
		totalAmount += itemTotal

		orderItems = append(orderItems, models.OrderItem{
			ProductID: productID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})

		// Reserve stock
		product.Stock -= item.Quantity
	}

	// Apply coupon if provided
	if req.CouponCode != "" {
		for _, coupon := range h.storage.Coupons {
			if coupon.Code == req.CouponCode &&
				time.Now().After(coupon.ValidFrom) &&
				time.Now().Before(coupon.ValidUntil) {

				if coupon.ApplicableTo.Products {
					// Check minimum amount
					if coupon.MinAmount != nil && totalAmount < *coupon.MinAmount {
						continue
					}

					var discount float64
					if coupon.Type == models.CouponTypePercentage {
						discount = totalAmount * (coupon.Value / 100)
						if coupon.MaxDiscount != nil && discount > *coupon.MaxDiscount {
							discount = *coupon.MaxDiscount
						}
					} else {
						discount = coupon.Value
					}

					totalAmount -= discount
					if totalAmount < 0 {
						totalAmount = 0
					}
					coupon.UsageCount++
				}
				break
			}
		}
	}

	order := &models.Order{
		ID:              uuid.New(),
		UserID:          userID,
		Status:          models.OrderStatusPending,
		Items:           orderItems,
		TotalAmount:     totalAmount,
		ShippingAddress: req.ShippingAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	h.storage.Orders[order.ID] = order

	c.JSON(http.StatusCreated, order)
}

// GET /api/orders/:id - Get order details
func (h *OrderHandler) GetOrder(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, exists := h.storage.Orders[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if order.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view another user's order"})
			return
		}
	}

	// Get product details for each item
	type OrderItemWithProduct struct {
		models.OrderItem
		Product *models.Product `json:"product"`
	}

	itemsWithProducts := make([]OrderItemWithProduct, 0, len(order.Items))
	for _, item := range order.Items {
		product := h.storage.Products[item.ProductID]
		itemsWithProducts = append(itemsWithProducts, OrderItemWithProduct{
			OrderItem: item,
			Product:   product,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"order": order,
		"items": itemsWithProducts,
	})
}

// PUT /api/orders/:id/status - Update order status (admin)
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, exists := h.storage.Orders[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var req UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status transition
	validStatuses := map[string]models.OrderStatus{
		"pending":   models.OrderStatusPending,
		"paid":      models.OrderStatusPaid,
		"shipped":   models.OrderStatusShipped,
		"delivered": models.OrderStatusDelivered,
		"cancelled": models.OrderStatusCancelled,
	}

	newStatus, valid := validStatuses[req.Status]
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	order.Status = newStatus
	order.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, order)
}

// POST /api/orders/:id/cancel - Cancel order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, exists := h.storage.Orders[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if order.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot cancel another user's order"})
			return
		}
	}

	// Can only cancel pending or paid orders
	if order.Status == models.OrderStatusShipped ||
		order.Status == models.OrderStatusDelivered ||
		order.Status == models.OrderStatusCancelled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel order in current status"})
		return
	}

	// Restore stock
	for _, item := range order.Items {
		if product, exists := h.storage.Products[item.ProductID]; exists {
			product.Stock += item.Quantity
		}
	}

	order.Status = models.OrderStatusCancelled
	order.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, gin.H{
		"message": "Order cancelled successfully",
		"order":   order,
	})
}
