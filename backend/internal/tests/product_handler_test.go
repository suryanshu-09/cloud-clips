package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"cloud-clips/internal/handlers"
	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupProductTestRouter() (*gin.Engine, *storage.MemoryStorage) {
	gin.SetMode(gin.TestMode)
	store := storage.NewMemoryStorage()
	productHandler := handlers.NewProductHandler(store)

	router := gin.New()
	router.GET("/api/products", productHandler.GetProducts)
	router.GET("/api/products/categories", productHandler.GetCategories)
	router.GET("/api/products/:id", productHandler.GetProduct)
	router.POST("/api/products", productHandler.CreateProduct)
	router.PUT("/api/products/:id", productHandler.UpdateProduct)
	router.DELETE("/api/products/:id", productHandler.DeleteProduct)
	router.PUT("/api/products/:id/stock", productHandler.UpdateStock)

	return router, store
}

func createTestProduct(store *storage.MemoryStorage, barberID *uuid.UUID) *models.Product {
	product := &models.Product{
		ID:           uuid.New(),
		Name:         "Premium Pomade",
		Description:  "High-quality styling pomade",
		Category:     "Hair Care",
		Price:        24.99,
		Images:       []string{"https://example.com/pomade.jpg"},
		Stock:        50,
		Rating:       4.5,
		TotalReviews: 25,
		BarberID:     barberID,
		Specs: map[string]string{
			"weight": "4oz",
			"hold":   "strong",
		},
	}
	store.Products[product.ID] = product
	return product
}

func TestProductHandler_GetProducts_Empty(t *testing.T) {
	router, _ := setupProductTestRouter()

	req, _ := http.NewRequest("GET", "/api/products", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(0), response["total"])
}

func TestProductHandler_GetProducts_WithData(t *testing.T) {
	router, store := setupProductTestRouter()
	createTestProduct(store, nil)
	createTestProduct(store, nil)

	req, _ := http.NewRequest("GET", "/api/products", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(2), response["total"])
}

func TestProductHandler_GetProducts_FilterByCategory(t *testing.T) {
	router, store := setupProductTestRouter()

	product1 := createTestProduct(store, nil)
	product1.Category = "Hair Care"

	product2 := createTestProduct(store, nil)
	product2.Category = "Beard Care"

	req, _ := http.NewRequest("GET", "/api/products?category=Hair+Care", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestProductHandler_GetProducts_FilterByPriceRange(t *testing.T) {
	router, store := setupProductTestRouter()

	product1 := createTestProduct(store, nil)
	product1.Price = 10.00

	product2 := createTestProduct(store, nil)
	product2.Price = 50.00

	// Filter products between $15 and $100
	req, _ := http.NewRequest("GET", "/api/products?minPrice=15&maxPrice=100", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestProductHandler_GetProducts_Search(t *testing.T) {
	router, store := setupProductTestRouter()

	product1 := createTestProduct(store, nil)
	product1.Name = "Premium Pomade"
	product1.Description = "For styling"

	product2 := createTestProduct(store, nil)
	product2.Name = "Beard Oil"
	product2.Description = "For beards"

	req, _ := http.NewRequest("GET", "/api/products?search=pomade", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["total"])
}

func TestProductHandler_GetProducts_SortByPrice(t *testing.T) {
	router, store := setupProductTestRouter()

	product1 := createTestProduct(store, nil)
	product1.Price = 50.00

	product2 := createTestProduct(store, nil)
	product2.Price = 10.00

	// Sort by price ascending
	req, _ := http.NewRequest("GET", "/api/products?sortBy=price&sortOrder=asc", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	products := response["products"].([]interface{})
	assert.Len(t, products, 2)

	firstProduct := products[0].(map[string]interface{})
	assert.Equal(t, float64(10), firstProduct["price"])
}

func TestProductHandler_GetProduct_Success(t *testing.T) {
	router, store := setupProductTestRouter()
	product := createTestProduct(store, nil)

	req, _ := http.NewRequest("GET", "/api/products/"+product.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	productData := response["product"].(map[string]interface{})
	assert.Equal(t, "Premium Pomade", productData["name"])
}

func TestProductHandler_GetProduct_NotFound(t *testing.T) {
	router, _ := setupProductTestRouter()

	req, _ := http.NewRequest("GET", "/api/products/"+uuid.New().String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestProductHandler_GetProduct_InvalidID(t *testing.T) {
	router, _ := setupProductTestRouter()

	req, _ := http.NewRequest("GET", "/api/products/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestProductHandler_GetCategories(t *testing.T) {
	router, store := setupProductTestRouter()

	product1 := createTestProduct(store, nil)
	product1.Category = "Hair Care"

	product2 := createTestProduct(store, nil)
	product2.Category = "Hair Care"

	product3 := createTestProduct(store, nil)
	product3.Category = "Beard Care"

	req, _ := http.NewRequest("GET", "/api/products/categories", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	categories := response["categories"].([]interface{})
	assert.Len(t, categories, 2)
}

func TestProductHandler_CreateProduct_Success(t *testing.T) {
	_, store := setupProductTestRouter()

	// Create barber user
	barberID := uuid.New()
	barber := &models.User{ID: barberID, Email: "barber@example.com", Name: "Barber", Role: models.RoleBarber}
	store.Users[barberID] = barber

	productHandler := handlers.NewProductHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/products", func(c *gin.Context) {
		c.Set("userID", barberID.String())
		c.Next()
	}, productHandler.CreateProduct)

	reqBody := map[string]interface{}{
		"name":        "New Pomade",
		"description": "Best pomade ever",
		"category":    "Hair Care",
		"price":       19.99,
		"stock":       100,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/products", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var product models.Product
	json.Unmarshal(w.Body.Bytes(), &product)
	assert.Equal(t, "New Pomade", product.Name)
	assert.Equal(t, 19.99, product.Price)
}

func TestProductHandler_CreateProduct_NotBarber(t *testing.T) {
	_, store := setupProductTestRouter()

	// Create client user (not barber)
	clientID := uuid.New()
	client := &models.User{ID: clientID, Email: "client@example.com", Name: "Client", Role: models.RoleClient}
	store.Users[clientID] = client

	productHandler := handlers.NewProductHandler(store)
	customRouter := gin.New()
	customRouter.POST("/api/products", func(c *gin.Context) {
		c.Set("userID", clientID.String())
		c.Next()
	}, productHandler.CreateProduct)

	reqBody := map[string]interface{}{
		"name":     "New Pomade",
		"category": "Hair Care",
		"price":    19.99,
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/products", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestProductHandler_UpdateProduct_Success(t *testing.T) {
	_, store := setupProductTestRouter()

	barberID := uuid.New()
	barber := &models.User{ID: barberID, Email: "barber@example.com", Name: "Barber", Role: models.RoleBarber}
	store.Users[barberID] = barber

	product := createTestProduct(store, &barberID)

	productHandler := handlers.NewProductHandler(store)
	customRouter := gin.New()
	customRouter.PUT("/api/products/:id", func(c *gin.Context) {
		c.Set("userID", barberID.String())
		c.Next()
	}, productHandler.UpdateProduct)

	updateBody := map[string]interface{}{
		"name":  "Updated Pomade",
		"price": 29.99,
	}
	body, _ := json.Marshal(updateBody)

	req, _ := http.NewRequest("PUT", "/api/products/"+product.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updatedProduct models.Product
	json.Unmarshal(w.Body.Bytes(), &updatedProduct)
	assert.Equal(t, "Updated Pomade", updatedProduct.Name)
	assert.Equal(t, 29.99, updatedProduct.Price)
}

func TestProductHandler_DeleteProduct_Success(t *testing.T) {
	_, store := setupProductTestRouter()

	barberID := uuid.New()
	barber := &models.User{ID: barberID, Email: "barber@example.com", Name: "Barber", Role: models.RoleBarber}
	store.Users[barberID] = barber

	product := createTestProduct(store, &barberID)

	productHandler := handlers.NewProductHandler(store)
	customRouter := gin.New()
	customRouter.DELETE("/api/products/:id", func(c *gin.Context) {
		c.Set("userID", barberID.String())
		c.Next()
	}, productHandler.DeleteProduct)

	req, _ := http.NewRequest("DELETE", "/api/products/"+product.ID.String(), nil)
	w := httptest.NewRecorder()
	customRouter.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	_, exists := store.Products[product.ID]
	assert.False(t, exists)
}

func TestProductHandler_UpdateStock_Success(t *testing.T) {
	router, store := setupProductTestRouter()
	product := createTestProduct(store, nil)

	updateBody := map[string]interface{}{
		"stock": 100,
	}
	body, _ := json.Marshal(updateBody)

	req, _ := http.NewRequest("PUT", "/api/products/"+product.ID.String()+"/stock", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, 100, store.Products[product.ID].Stock)
}

func TestProductHandler_Pagination(t *testing.T) {
	router, store := setupProductTestRouter()

	// Create 25 products
	for i := 0; i < 25; i++ {
		createTestProduct(store, nil)
	}

	// Get first page
	req, _ := http.NewRequest("GET", "/api/products?page=1&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, float64(25), response["total"])
	assert.Equal(t, float64(1), response["page"])
	assert.Equal(t, float64(10), response["limit"])
	assert.Equal(t, float64(3), response["totalPages"])
	products := response["products"].([]interface{})
	assert.Len(t, products, 10)
}
