package handlers

import (
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

type CouponHandler struct {
	storage *storage.MemoryStorage
}

func NewCouponHandler(storage *storage.MemoryStorage) *CouponHandler {
	return &CouponHandler{storage: storage}
}

// Request types
type CreateCouponRequest struct {
	Code         string              `json:"code" binding:"required"`
	Type         string              `json:"type" binding:"required"` // percentage, fixed
	Value        float64             `json:"value" binding:"required,min=0"`
	MinAmount    *float64            `json:"minAmount"`
	MaxDiscount  *float64            `json:"maxDiscount"`
	ValidFrom    string              `json:"validFrom" binding:"required"`
	ValidUntil   string              `json:"validUntil" binding:"required"`
	UsageLimit   *int                `json:"usageLimit"`
	ApplicableTo models.ApplicableTo `json:"applicableTo"`
}

type ValidateCouponRequest struct {
	Code      string  `json:"code" binding:"required"`
	Amount    float64 `json:"amount" binding:"required,min=0"`
	IsService bool    `json:"isService"` // true for services, false for products
}

// GET /api/coupons - List available coupons
func (h *CouponHandler) GetCoupons(c *gin.Context) {
	// Query parameters
	category := c.Query("category") // services, products, all
	active := c.DefaultQuery("active", "true")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	now := time.Now()
	coupons := make([]*models.Coupon, 0)

	for _, coupon := range h.storage.Coupons {
		// Filter by active status
		if active == "true" {
			if now.Before(coupon.ValidFrom) || now.After(coupon.ValidUntil) {
				continue
			}
			if coupon.UsageLimit != nil && coupon.UsageCount >= *coupon.UsageLimit {
				continue
			}
		}

		// Filter by category
		if category == "services" && !coupon.ApplicableTo.Services {
			continue
		}
		if category == "products" && !coupon.ApplicableTo.Products {
			continue
		}

		coupons = append(coupons, coupon)
	}

	// Sort by expiry date ascending (soonest first)
	sort.Slice(coupons, func(i, j int) bool {
		return coupons[i].ValidUntil.Before(coupons[j].ValidUntil)
	})

	// Paginate
	total := len(coupons)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"coupons":    coupons[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}

// GET /api/coupons/:code - Get coupon by code
func (h *CouponHandler) GetCouponByCode(c *gin.Context) {
	code := c.Param("code")

	for _, coupon := range h.storage.Coupons {
		if strings.EqualFold(coupon.Code, code) {
			now := time.Now()
			isActive := now.After(coupon.ValidFrom) && now.Before(coupon.ValidUntil)
			if coupon.UsageLimit != nil && coupon.UsageCount >= *coupon.UsageLimit {
				isActive = false
			}

			c.JSON(http.StatusOK, gin.H{
				"coupon":   coupon,
				"isActive": isActive,
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
}

// POST /api/coupons/validate - Validate coupon for order
func (h *CouponHandler) ValidateCoupon(c *gin.Context) {
	var req ValidateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, coupon := range h.storage.Coupons {
		if strings.EqualFold(coupon.Code, req.Code) {
			now := time.Now()

			// Check if coupon is valid
			if now.Before(coupon.ValidFrom) {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid":    false,
					"error":    "Coupon is not yet active",
					"startsAt": coupon.ValidFrom,
				})
				return
			}

			if now.After(coupon.ValidUntil) {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid": false,
					"error": "Coupon has expired",
				})
				return
			}

			if coupon.UsageLimit != nil && coupon.UsageCount >= *coupon.UsageLimit {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid": false,
					"error": "Coupon usage limit reached",
				})
				return
			}

			// Check applicability
			if req.IsService && !coupon.ApplicableTo.Services {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid": false,
					"error": "Coupon is not applicable to services",
				})
				return
			}

			if !req.IsService && !coupon.ApplicableTo.Products {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid": false,
					"error": "Coupon is not applicable to products",
				})
				return
			}

			// Check minimum amount
			if coupon.MinAmount != nil && req.Amount < *coupon.MinAmount {
				c.JSON(http.StatusBadRequest, gin.H{
					"valid":     false,
					"error":     "Minimum order amount not met",
					"minAmount": *coupon.MinAmount,
				})
				return
			}

			// Calculate discount
			var discount float64
			if coupon.Type == models.CouponTypePercentage {
				discount = req.Amount * (coupon.Value / 100)
				if coupon.MaxDiscount != nil && discount > *coupon.MaxDiscount {
					discount = *coupon.MaxDiscount
				}
			} else {
				discount = coupon.Value
				if discount > req.Amount {
					discount = req.Amount
				}
			}

			c.JSON(http.StatusOK, gin.H{
				"valid":       true,
				"coupon":      coupon,
				"discount":    discount,
				"finalAmount": req.Amount - discount,
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{
		"valid": false,
		"error": "Coupon not found",
	})
}

// POST /api/coupons - Create coupon (barber/admin)
func (h *CouponHandler) CreateCoupon(c *gin.Context) {
	var req CreateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if code already exists
	for _, coupon := range h.storage.Coupons {
		if strings.EqualFold(coupon.Code, req.Code) {
			c.JSON(http.StatusConflict, gin.H{"error": "Coupon code already exists"})
			return
		}
	}

	// Parse dates
	validFrom, err := time.Parse(time.RFC3339, req.ValidFrom)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid validFrom date format"})
		return
	}

	validUntil, err := time.Parse(time.RFC3339, req.ValidUntil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid validUntil date format"})
		return
	}

	if validUntil.Before(validFrom) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validUntil must be after validFrom"})
		return
	}

	// Determine coupon type
	couponType := models.CouponTypePercentage
	if req.Type == "fixed" {
		couponType = models.CouponTypeFixed
	}

	coupon := &models.Coupon{
		ID:           uuid.New(),
		Code:         strings.ToUpper(req.Code),
		Type:         couponType,
		Value:        req.Value,
		MinAmount:    req.MinAmount,
		MaxDiscount:  req.MaxDiscount,
		ValidFrom:    validFrom,
		ValidUntil:   validUntil,
		UsageLimit:   req.UsageLimit,
		UsageCount:   0,
		ApplicableTo: req.ApplicableTo,
	}

	h.storage.Coupons[coupon.ID] = coupon

	c.JSON(http.StatusCreated, coupon)
}

// PUT /api/coupons/:id - Update coupon
func (h *CouponHandler) UpdateCoupon(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid coupon ID"})
		return
	}

	coupon, exists := h.storage.Coupons[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
		return
	}

	var req struct {
		Value        *float64             `json:"value"`
		MinAmount    *float64             `json:"minAmount"`
		MaxDiscount  *float64             `json:"maxDiscount"`
		ValidUntil   string               `json:"validUntil"`
		UsageLimit   *int                 `json:"usageLimit"`
		ApplicableTo *models.ApplicableTo `json:"applicableTo"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Value != nil {
		coupon.Value = *req.Value
	}
	if req.MinAmount != nil {
		coupon.MinAmount = req.MinAmount
	}
	if req.MaxDiscount != nil {
		coupon.MaxDiscount = req.MaxDiscount
	}
	if req.ValidUntil != "" {
		validUntil, err := time.Parse(time.RFC3339, req.ValidUntil)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid validUntil date format"})
			return
		}
		coupon.ValidUntil = validUntil
	}
	if req.UsageLimit != nil {
		coupon.UsageLimit = req.UsageLimit
	}
	if req.ApplicableTo != nil {
		coupon.ApplicableTo = *req.ApplicableTo
	}

	c.JSON(http.StatusOK, coupon)
}

// DELETE /api/coupons/:id - Delete coupon
func (h *CouponHandler) DeleteCoupon(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid coupon ID"})
		return
	}

	if _, exists := h.storage.Coupons[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
		return
	}

	delete(h.storage.Coupons, id)
	c.JSON(http.StatusOK, gin.H{"message": "Coupon deleted successfully"})
}
