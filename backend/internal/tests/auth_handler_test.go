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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupAuthTestRouter() (*gin.Engine, *handlers.AuthHandler) {
	store := storage.NewMemoryStorage()
	authHandler := handlers.NewAuthHandler(store)

	router := gin.New()
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)
	router.POST("/api/auth/logout", authHandler.Logout)
	router.POST("/api/auth/refresh", authHandler.RefreshToken)
	router.POST("/api/auth/forgot", authHandler.ForgotPassword)
	router.POST("/api/auth/reset-password", authHandler.ResetPassword)
	router.POST("/api/auth/verify-email", authHandler.VerifyEmail)
	router.POST("/api/auth/resend-verification", authHandler.ResendVerification)
	router.POST("/api/auth/firebase-sync", authHandler.FirebaseSync)
	router.GET("/api/auth/me", authHandler.GetCurrentUser)

	return router, authHandler
}

func TestAuthHandler_Register_Success(t *testing.T) {
	router, _ := setupAuthTestRouter()

	reqBody := map[string]string{
		"email":    "newuser@example.com",
		"password": "password123",
		"name":     "New User",
		"phone":    "+1234567890",
		"role":     "client",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.NotEmpty(t, response["accessToken"])
	assert.NotEmpty(t, response["refreshToken"])
	assert.NotNil(t, response["user"])
	assert.NotNil(t, response["expiresAt"])

	user := response["user"].(map[string]interface{})
	assert.Equal(t, "newuser@example.com", user["email"])
	assert.Equal(t, "New User", user["name"])
	assert.Equal(t, "client", user["role"])
}

func TestAuthHandler_Register_BarberRole(t *testing.T) {
	router, _ := setupAuthTestRouter()

	reqBody := map[string]string{
		"email":    "barber@example.com",
		"password": "password123",
		"name":     "Barber User",
		"role":     "barber",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	user := response["user"].(map[string]interface{})
	assert.Equal(t, "barber", user["role"])
}

func TestAuthHandler_Register_InvalidEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	reqBody := map[string]string{
		"email":    "invalid-email",
		"password": "password123",
		"name":     "Test User",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_Register_ShortPassword(t *testing.T) {
	router, _ := setupAuthTestRouter()

	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "short",
		"name":     "Test User",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_Register_DuplicateEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// First registration
	reqBody := map[string]string{
		"email":    "duplicate@example.com",
		"password": "password123",
		"name":     "First User",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Second registration with same email
	reqBody["name"] = "Second User"
	body, _ = json.Marshal(reqBody)

	req, _ = http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Email already registered", response["error"])
}

func TestAuthHandler_Register_MissingName(t *testing.T) {
	router, _ := setupAuthTestRouter()

	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// First register a user
	registerBody := map[string]string{
		"email":    "login@example.com",
		"password": "password123",
		"name":     "Login User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Now login
	loginBody := map[string]string{
		"email":    "login@example.com",
		"password": "password123",
	}
	body, _ = json.Marshal(loginBody)
	req, _ = http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.NotEmpty(t, response["accessToken"])
	assert.NotEmpty(t, response["refreshToken"])
	assert.NotNil(t, response["user"])
}

func TestAuthHandler_Login_WrongPassword(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register user
	registerBody := map[string]string{
		"email":    "wrongpw@example.com",
		"password": "password123",
		"name":     "Test User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Login with wrong password
	loginBody := map[string]string{
		"email":    "wrongpw@example.com",
		"password": "wrongpassword",
	}
	body, _ = json.Marshal(loginBody)
	req, _ = http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Invalid email or password", response["error"])
}

func TestAuthHandler_Login_NonexistentUser(t *testing.T) {
	router, _ := setupAuthTestRouter()

	loginBody := map[string]string{
		"email":    "nonexistent@example.com",
		"password": "password123",
	}
	body, _ := json.Marshal(loginBody)
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthHandler_Login_InvalidEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	loginBody := map[string]string{
		"email":    "not-an-email",
		"password": "password123",
	}
	body, _ := json.Marshal(loginBody)
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_Logout(t *testing.T) {
	router, _ := setupAuthTestRouter()

	req, _ := http.NewRequest("POST", "/api/auth/logout", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Logged out successfully", response["message"])
}

func TestAuthHandler_RefreshToken_Success(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register user first
	registerBody := map[string]string{
		"email":    "refresh@example.com",
		"password": "password123",
		"name":     "Refresh User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var registerResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &registerResp)
	refreshToken := registerResp["refreshToken"].(string)

	// Now refresh the token
	refreshBody := map[string]string{
		"refreshToken": refreshToken,
	}
	body, _ = json.Marshal(refreshBody)
	req, _ = http.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotEmpty(t, response["accessToken"])
	assert.NotEmpty(t, response["refreshToken"])
}

func TestAuthHandler_RefreshToken_Invalid(t *testing.T) {
	router, _ := setupAuthTestRouter()

	refreshBody := map[string]string{
		"refreshToken": "invalid-token",
	}
	body, _ := json.Marshal(refreshBody)
	req, _ := http.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthHandler_ForgotPassword_Success(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register user first
	registerBody := map[string]string{
		"email":    "forgot@example.com",
		"password": "password123",
		"name":     "Forgot User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Request password reset
	forgotBody := map[string]string{
		"email": "forgot@example.com",
	}
	body, _ = json.Marshal(forgotBody)
	req, _ = http.NewRequest("POST", "/api/auth/forgot", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response["message"], "reset link will be sent")
}

func TestAuthHandler_ForgotPassword_NonexistentEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Should still return success to prevent email enumeration
	forgotBody := map[string]string{
		"email": "nonexistent@example.com",
	}
	body, _ := json.Marshal(forgotBody)
	req, _ := http.NewRequest("POST", "/api/auth/forgot", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthHandler_ResetPassword_InvalidToken(t *testing.T) {
	router, _ := setupAuthTestRouter()

	resetBody := map[string]string{
		"token":       "invalid-reset-token",
		"newPassword": "newpassword123",
	}
	body, _ := json.Marshal(resetBody)
	req, _ := http.NewRequest("POST", "/api/auth/reset-password", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response["error"], "Invalid or expired")
}

func TestAuthHandler_VerifyEmail_InvalidToken(t *testing.T) {
	router, _ := setupAuthTestRouter()

	verifyBody := map[string]string{
		"token": "invalid-verify-token",
	}
	body, _ := json.Marshal(verifyBody)
	req, _ := http.NewRequest("POST", "/api/auth/verify-email", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_ResendVerification_Success(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register user first
	registerBody := map[string]string{
		"email":    "resend@example.com",
		"password": "password123",
		"name":     "Resend User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Resend verification
	resendBody := map[string]string{
		"email": "resend@example.com",
	}
	body, _ = json.Marshal(resendBody)
	req, _ = http.NewRequest("POST", "/api/auth/resend-verification", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthHandler_FirebaseSync_NewUser(t *testing.T) {
	router, _ := setupAuthTestRouter()

	syncBody := map[string]string{
		"firebaseUid": "firebase-uid-123",
		"email":       "firebase@example.com",
		"name":        "Firebase User",
		"avatar":      "https://example.com/avatar.jpg",
	}
	body, _ := json.Marshal(syncBody)
	req, _ := http.NewRequest("POST", "/api/auth/firebase-sync", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var user models.User
	err := json.Unmarshal(w.Body.Bytes(), &user)
	require.NoError(t, err)
	assert.Equal(t, "firebase@example.com", user.Email)
	assert.Equal(t, "Firebase User", user.Name)
	assert.Equal(t, models.RoleClient, user.Role)
}

func TestAuthHandler_FirebaseSync_ExistingUser(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// First sync creates the user
	syncBody := map[string]string{
		"firebaseUid": "firebase-uid-456",
		"email":       "existing@example.com",
		"name":        "Original Name",
	}
	body, _ := json.Marshal(syncBody)
	req, _ := http.NewRequest("POST", "/api/auth/firebase-sync", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Second sync should update
	syncBody["name"] = "Updated Name"
	syncBody["avatar"] = "https://example.com/new-avatar.jpg"
	body, _ = json.Marshal(syncBody)
	req, _ = http.NewRequest("POST", "/api/auth/firebase-sync", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var user models.User
	err := json.Unmarshal(w.Body.Bytes(), &user)
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", user.Name)
}

func TestAuthHandler_GetCurrentUser_Unauthenticated(t *testing.T) {
	router, _ := setupAuthTestRouter()

	req, _ := http.NewRequest("GET", "/api/auth/me", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthHandler_ValidateToken(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register and get a valid token
	registerBody := map[string]string{
		"email":    "validate@example.com",
		"password": "password123",
		"name":     "Validate User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	accessToken := response["accessToken"].(string)

	// Validate the token
	claims, err := handlers.ValidateToken(accessToken)
	require.NoError(t, err)
	assert.Equal(t, "validate@example.com", claims.Email)
	assert.Equal(t, models.RoleClient, claims.Role)
}

func TestAuthHandler_ValidateToken_Invalid(t *testing.T) {
	claims, err := handlers.ValidateToken("invalid-token")
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestAuthHandler_Register_CaseInsensitiveEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register with lowercase email
	registerBody := map[string]string{
		"email":    "case@example.com",
		"password": "password123",
		"name":     "Case User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Try to register with uppercase email
	registerBody["email"] = "CASE@EXAMPLE.COM"
	body, _ = json.Marshal(registerBody)
	req, _ = http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestAuthHandler_Login_CaseInsensitiveEmail(t *testing.T) {
	router, _ := setupAuthTestRouter()

	// Register user
	registerBody := map[string]string{
		"email":    "logincase@example.com",
		"password": "password123",
		"name":     "Login Case User",
	}
	body, _ := json.Marshal(registerBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Login with different case
	loginBody := map[string]string{
		"email":    "LOGINCASE@EXAMPLE.COM",
		"password": "password123",
	}
	body, _ = json.Marshal(loginBody)
	req, _ = http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
