package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	storage *storage.MemoryStorage
}

func NewProductHandler(storage *storage.MemoryStorage) *ProductHandler {
	return &ProductHandler{storage: storage}
}

// Request types
type CreateProductRequest struct {
	Name        string            `json:"name" binding:"required"`
	Description string            `json:"description"`
	Category    string            `json:"category" binding:"required"`
	Price       float64           `json:"price" binding:"required,min=0"`
	Images      []string          `json:"images"`
	Stock       int               `json:"stock"`
	Specs       map[string]string `json:"specs"`
}

type UpdateProductRequest struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Category    string            `json:"category"`
	Price       float64           `json:"price"`
	Images      []string          `json:"images"`
	Stock       int               `json:"stock"`
	Specs       map[string]string `json:"specs"`
}

// GET /api/products - List products with filters
func (h *ProductHandler) GetProducts(c *gin.Context) {
	// Query parameters
	category := c.Query("category")
	barberID := c.Query("barberId")
	minPrice, _ := strconv.ParseFloat(c.Query("minPrice"), 64)
	maxPrice, _ := strconv.ParseFloat(c.Query("maxPrice"), 64)
	minRating, _ := strconv.ParseFloat(c.Query("minRating"), 64)
	search := c.Query("search")
	sortBy := c.DefaultQuery("sortBy", "rating") // rating, price, name
	sortOrder := c.DefaultQuery("sortOrder", "desc")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	products := make([]*models.Product, 0)
	for _, product := range h.storage.Products {
		// Filter by category
		if category != "" && !strings.EqualFold(product.Category, category) {
			continue
		}

		// Filter by barber
		if barberID != "" {
			bid, err := uuid.Parse(barberID)
			if err == nil && (product.BarberID == nil || *product.BarberID != bid) {
				continue
			}
		}

		// Filter by price range
		if minPrice > 0 && product.Price < minPrice {
			continue
		}
		if maxPrice > 0 && product.Price > maxPrice {
			continue
		}

		// Filter by rating
		if minRating > 0 && product.Rating < minRating {
			continue
		}

		// Search in name and description
		if search != "" {
			searchLower := strings.ToLower(search)
			if !strings.Contains(strings.ToLower(product.Name), searchLower) &&
				!strings.Contains(strings.ToLower(product.Description), searchLower) {
				continue
			}
		}

		products = append(products, product)
	}

	// Sort products
	sort.Slice(products, func(i, j int) bool {
		switch sortBy {
		case "price":
			if sortOrder == "asc" {
				return products[i].Price < products[j].Price
			}
			return products[i].Price > products[j].Price
		case "name":
			if sortOrder == "asc" {
				return products[i].Name < products[j].Name
			}
			return products[i].Name > products[j].Name
		default: // rating
			if sortOrder == "asc" {
				return products[i].Rating < products[j].Rating
			}
			return products[i].Rating > products[j].Rating
		}
	})

	// Paginate
	total := len(products)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"products":   products[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}

// GET /api/products/:id - Get product details
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, exists := h.storage.Products[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Get barber info if available
	var barber *models.User
	var barberProfile *models.BarberProfile
	if product.BarberID != nil {
		if user, ok := h.storage.Users[*product.BarberID]; ok {
			barber = user
		}
		if profile, ok := h.storage.BarberProfiles[*product.BarberID]; ok {
			barberProfile = profile
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"product":       product,
		"barber":        barber,
		"barberProfile": barberProfile,
	})
}

// GET /api/products/categories - Get product categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	categories := make(map[string]int)
	for _, product := range h.storage.Products {
		categories[product.Category]++
	}

	categoryList := make([]gin.H, 0)
	for name, count := range categories {
		categoryList = append(categoryList, gin.H{
			"name":  name,
			"count": count,
		})
	}

	// Sort by count descending
	sort.Slice(categoryList, func(i, j int) bool {
		return categoryList[i]["count"].(int) > categoryList[j]["count"].(int)
	})

	c.JSON(http.StatusOK, gin.H{"categories": categoryList})
}

// POST /api/products - Create product (barber only)
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get barber ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	barberID, _ := uuid.Parse(userIDStr.(string))

	// Verify user is a barber
	user, userExists := h.storage.Users[barberID]
	if !userExists || user.Role != models.RoleBarber {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only barbers can create products"})
		return
	}

	product := &models.Product{
		ID:           uuid.New(),
		Name:         req.Name,
		Description:  req.Description,
		Category:     req.Category,
		Price:        req.Price,
		Images:       req.Images,
		Stock:        req.Stock,
		Rating:       0,
		TotalReviews: 0,
		BarberID:     &barberID,
		Specs:        req.Specs,
	}

	if product.Images == nil {
		product.Images = []string{}
	}
	if product.Specs == nil {
		product.Specs = make(map[string]string)
	}

	h.storage.Products[product.ID] = product

	c.JSON(http.StatusCreated, product)
}

// PUT /api/products/:id - Update product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, exists := h.storage.Products[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if product.BarberID != nil && *product.BarberID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update another barber's product"})
			return
		}
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		product.Name = req.Name
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.Images != nil {
		product.Images = req.Images
	}
	if req.Stock >= 0 {
		product.Stock = req.Stock
	}
	if req.Specs != nil {
		product.Specs = req.Specs
	}

	c.JSON(http.StatusOK, product)
}

// DELETE /api/products/:id - Delete product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, exists := h.storage.Products[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Verify ownership
	userIDStr, _ := c.Get("userID")
	if userIDStr != nil {
		userID, _ := uuid.Parse(userIDStr.(string))
		if product.BarberID != nil && *product.BarberID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete another barber's product"})
			return
		}
	}

	delete(h.storage.Products, id)
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// PUT /api/products/:id/stock - Update product stock
func (h *ProductHandler) UpdateStock(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, exists := h.storage.Products[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var req struct {
		Stock int `json:"stock" binding:"min=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product.Stock = req.Stock

	c.JSON(http.StatusOK, gin.H{
		"message": "Stock updated successfully",
		"product": product,
	})
}
