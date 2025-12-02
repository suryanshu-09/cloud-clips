package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	storage *storage.MemoryStorage
}

func NewAuthHandler(storage *storage.MemoryStorage) *AuthHandler {
	return &AuthHandler{storage: storage}
}

// JWT Claims structure
type Claims struct {
	UserID string          `json:"userId"`
	Email  string          `json:"email"`
	Role   models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// Request/Response types
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone"`
	Role     string `json:"role"` // "client" or "barber", defaults to "client"
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	ExpiresAt    int64        `json:"expiresAt"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type FirebaseSyncRequest struct {
	FirebaseUID string `json:"firebaseUid" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Name        string `json:"name" binding:"required"`
	Avatar      string `json:"avatar"`
}

// Helper functions
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-256-bit-secret-key-for-development-only"
	}
	return []byte(secret)
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (h *AuthHandler) generateTokens(user *models.User) (accessToken, refreshToken string, expiresAt int64, err error) {
	// Access token expires in 24 hours
	accessExpiry := time.Now().Add(24 * time.Hour)
	expiresAt = accessExpiry.Unix()

	accessClaims := &Claims{
		UserID: user.ID.String(),
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}

	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenObj.SignedString(getJWTSecret())
	if err != nil {
		return "", "", 0, err
	}

	// Refresh token expires in 7 days
	refreshExpiry := time.Now().Add(7 * 24 * time.Hour)
	refreshClaims := &Claims{
		UserID: user.ID.String(),
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExpiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}

	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshTokenObj.SignedString(getJWTSecret())
	if err != nil {
		return "", "", 0, err
	}

	return accessToken, refreshToken, expiresAt, nil
}

// UserCredentials stores password hashes (in production, this would be in the database)
var userCredentials = make(map[string]string) // email -> password hash

// POST /api/auth/register - Create new user
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email already exists
	for _, user := range h.storage.Users {
		if strings.EqualFold(user.Email, req.Email) {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Determine role
	role := models.RoleClient
	if req.Role == "barber" {
		role = models.RoleBarber
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Phone:        req.Phone,
		Name:         req.Name,
		Role:         role,
		Location:     models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:    time.Now(),
		LastActive:   time.Now(),
		AuthProvider: models.AuthProviderEmail,
		NotificationPrefs: models.NotificationPrefs{
			Push:  true,
			SMS:   true,
			Email: true,
		},
	}

	// Store user and credentials
	h.storage.Users[user.ID] = user
	userCredentials[user.Email] = hashedPassword

	// If barber, create empty barber profile
	if role == models.RoleBarber {
		h.storage.BarberProfiles[user.ID] = &models.BarberProfile{
			ID:               user.ID,
			UserID:           user.ID,
			Bio:              nil,
			Specialties:      []string{},
			Experience:       0,
			ServiceLocations: []models.ServiceLocation{},
			WorkingHours:     make(map[string]models.WorkingHour),
			Services:         []models.Service{},
			Gallery:          []models.GalleryItem{},
			Rating:           0,
			TotalReviews:     0,
			IsVerified:       false,
			Location:         models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		}
	}

	// Generate tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	})
}

// POST /api/auth/login - Login with email/password
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user *models.User
	for _, u := range h.storage.Users {
		if strings.EqualFold(u.Email, req.Email) {
			user = u
			break
		}
	}

	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	hashedPassword, exists := userCredentials[user.Email]
	if !exists || !checkPassword(req.Password, hashedPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Update last active
	user.LastActive = time.Now()

	// Generate tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	})
}

// POST /api/auth/logout - Invalidate token (for stateful token tracking)
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side
	// For stateful tracking, you'd invalidate the token in a blacklist
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// POST /api/auth/refresh - Refresh JWT token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse and validate refresh token
	token, err := jwt.ParseWithClaims(req.RefreshToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	// Get user
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
		return
	}

	user, exists := h.storage.Users[userID]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Generate new tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	})
}

// POST /api/auth/forgot - Request password reset
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user *models.User
	for _, u := range h.storage.Users {
		if strings.EqualFold(u.Email, req.Email) {
			user = u
			break
		}
	}

	// Always return success to prevent email enumeration
	if user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link will be sent"})
		return
	}

	// Generate reset token (in production, store this and send via email)
	resetToken := uuid.New().String()
	_ = resetToken // TODO: Store token and send email

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link will be sent"})
}

// POST /api/auth/reset - Reset password with token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Validate reset token and get associated user
	// For now, return an error as this needs token storage
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Password reset via token not yet implemented"})
}

// POST /api/auth/verify - Verify email
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token required"})
		return
	}

	// TODO: Validate verification token
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Email verification not yet implemented"})
}

// GET /api/auth/me - Get current user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[uid]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// POST /api/auth/firebase-sync - Sync Firebase user with backend
func (h *AuthHandler) FirebaseSync(c *gin.Context) {
	var req FirebaseSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists by email
	for _, user := range h.storage.Users {
		if strings.EqualFold(user.Email, req.Email) {
			// Update existing user
			user.Name = req.Name
			if req.Avatar != "" {
				user.Avatar = &req.Avatar
			}
			user.LastActive = time.Now()
			c.JSON(http.StatusOK, user)
			return
		}
	}

	// Create new user
	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Name:         req.Name,
		Avatar:       &req.Avatar,
		Role:         models.RoleClient,
		Location:     models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:    time.Now(),
		LastActive:   time.Now(),
		AuthProvider: models.AuthProviderGoogle, // Default to Google for Firebase sync
		NotificationPrefs: models.NotificationPrefs{
			Push:  true,
			SMS:   true,
			Email: true,
		},
	}

	h.storage.Users[user.ID] = user
	c.JSON(http.StatusCreated, user)
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// OAuth Request types
type GoogleAuthRequest struct {
	IDToken string `json:"idToken" binding:"required"`
}

type AppleAuthRequest struct {
	IdentityToken string `json:"identityToken" binding:"required"`
	FullName      string `json:"fullName"`
	Email         string `json:"email"`
}

type OAuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	ExpiresAt    int64        `json:"expiresAt"`
	IsNewUser    bool         `json:"isNewUser"`
}

// POST /api/auth/google - Sign in with Google
func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var req GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production, verify the ID token with Google's tokeninfo endpoint
	// or use the Google Auth library to validate the token
	// For now, we'll provide a placeholder that can be extended

	// TODO: Verify Google ID token
	// 1. Use google.golang.org/api/oauth2/v2 to verify token
	// 2. Extract user info from verified token
	// Example verification:
	// tokenInfo, err := oauth2Service.Tokeninfo().IdToken(req.IDToken).Do()
	// if err != nil {
	//     c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google ID token"})
	//     return
	// }

	// For development, return an error indicating full implementation is needed
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Google OAuth not fully configured",
		"message": "To enable Google authentication, configure GOOGLE_CLIENT_ID and verify the ID token using Google's OAuth2 API",
		"steps": []string{
			"1. Set GOOGLE_CLIENT_ID environment variable",
			"2. Add google.golang.org/api/oauth2/v2 dependency",
			"3. Verify ID token with Google's tokeninfo endpoint",
			"4. Extract user email and profile from verified token",
		},
	})
}

// POST /api/auth/apple - Sign in with Apple
func (h *AuthHandler) AppleAuth(c *gin.Context) {
	var req AppleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production, verify the identity token with Apple's public keys
	// For now, we'll provide a placeholder

	// TODO: Verify Apple Identity Token
	// 1. Fetch Apple's public keys from https://appleid.apple.com/auth/keys
	// 2. Verify JWT signature using the public keys
	// 3. Validate token claims (iss, aud, exp)
	// 4. Extract user info from verified token

	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Apple Sign-In not fully configured",
		"message": "To enable Apple authentication, configure Apple Sign-In credentials and verify the identity token",
		"steps": []string{
			"1. Configure Apple Developer account with Sign In with Apple",
			"2. Set APPLE_CLIENT_ID environment variable",
			"3. Fetch and cache Apple's public keys",
			"4. Verify identity token JWT signature and claims",
		},
	})
}

// Helper function to create or update OAuth user
func (h *AuthHandler) findOrCreateOAuthUser(email, name, avatar string, provider models.AuthProvider) (*models.User, bool) {
	// Check if user already exists by email
	for _, user := range h.storage.Users {
		if strings.EqualFold(user.Email, email) {
			// Update existing user with latest OAuth info
			if name != "" {
				user.Name = name
			}
			if avatar != "" {
				user.Avatar = &avatar
			}
			user.LastActive = time.Now()
			return user, false // Not a new user
		}
	}

	// Create new user
	user := &models.User{
		ID:           uuid.New(),
		Email:        email,
		Name:         name,
		Role:         models.RoleClient,
		Location:     models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:    time.Now(),
		LastActive:   time.Now(),
		AuthProvider: provider,
		NotificationPrefs: models.NotificationPrefs{
			Push:  true,
			SMS:   true,
			Email: true,
		},
	}

	if avatar != "" {
		user.Avatar = &avatar
	}

	h.storage.Users[user.ID] = user
	return user, true // Is a new user
}
