package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/services"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	storage      *storage.MemoryStorage
	emailService *services.EmailService
}

func NewAuthHandler(storage *storage.MemoryStorage) *AuthHandler {
	return &AuthHandler{
		storage:      storage,
		emailService: services.NewEmailService(nil),
	}
}

// NewAuthHandlerWithEmail creates an auth handler with email service
func NewAuthHandlerWithEmail(storage *storage.MemoryStorage, emailService *services.EmailService) *AuthHandler {
	return &AuthHandler{
		storage:      storage,
		emailService: emailService,
	}
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

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
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

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
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

// Token storage for verification and password reset
var (
	verificationTokens     = make(map[string]tokenData) // token -> tokenData
	passwordResetTokens    = make(map[string]tokenData) // token -> tokenData
	tokenMutex             sync.RWMutex
	passwordResetRateLimit = make(map[string]time.Time) // email -> last request time
	rateLimitMutex         sync.RWMutex
)

type tokenData struct {
	UserID    uuid.UUID
	Email     string
	ExpiresAt time.Time
}

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
		ID:            uuid.New(),
		Email:         req.Email,
		Phone:         req.Phone,
		Name:          req.Name,
		Role:          role,
		Location:      models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:     time.Now(),
		LastActive:    time.Now(),
		AuthProvider:  models.AuthProviderEmail,
		EmailVerified: false,
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

	// Generate email verification token
	verifyToken, err := generateSecureToken(32)
	if err == nil {
		tokenMutex.Lock()
		verificationTokens[verifyToken] = tokenData{
			UserID:    user.ID,
			Email:     user.Email,
			ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hour expiry
		}
		tokenMutex.Unlock()

		// Send verification email (non-blocking)
		go func() {
			if h.emailService != nil {
				h.emailService.SendVerificationEmail(user.Email, user.Name, verifyToken)
			}
		}()
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

	// Check if user is banned
	if user.Banned {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is suspended", "reason": user.BannedReason})
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
	token, err := jwt.ParseWithClaims(req.RefreshToken, &Claims{}, func(token *jwt.Token) (any, error) {
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

	// Rate limiting: only allow one request per email per 60 seconds
	rateLimitMutex.RLock()
	lastRequest, exists := passwordResetRateLimit[strings.ToLower(req.Email)]
	rateLimitMutex.RUnlock()

	if exists && time.Since(lastRequest) < 60*time.Second {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":      "Please wait before requesting another reset email",
			"retryAfter": 60 - int(time.Since(lastRequest).Seconds()),
		})
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

	// Update rate limit
	rateLimitMutex.Lock()
	passwordResetRateLimit[strings.ToLower(req.Email)] = time.Now()
	rateLimitMutex.Unlock()

	// Generate reset token
	resetToken, err := generateSecureToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}

	// Store token with 1 hour expiry
	tokenMutex.Lock()
	// Remove any existing tokens for this user
	for token, data := range passwordResetTokens {
		if data.UserID == user.ID {
			delete(passwordResetTokens, token)
		}
	}
	passwordResetTokens[resetToken] = tokenData{
		UserID:    user.ID,
		Email:     user.Email,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	tokenMutex.Unlock()

	// Store token in user model as well (for reference)
	user.ResetToken = &resetToken
	expiry := time.Now().Add(1 * time.Hour)
	user.ResetTokenExpires = &expiry

	// Send reset email (non-blocking)
	go func() {
		if h.emailService != nil {
			h.emailService.SendPasswordResetEmail(user.Email, user.Name, resetToken)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link will be sent"})
}

// POST /api/auth/reset-password - Reset password with token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate token
	tokenMutex.RLock()
	data, exists := passwordResetTokens[req.Token]
	tokenMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	// Check expiry
	if time.Now().After(data.ExpiresAt) {
		// Clean up expired token
		tokenMutex.Lock()
		delete(passwordResetTokens, req.Token)
		tokenMutex.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token has expired"})
		return
	}

	// Get user
	user, exists := h.storage.Users[data.UserID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Hash new password
	hashedPassword, err := hashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	userCredentials[user.Email] = hashedPassword

	// Clear reset token
	user.ResetToken = nil
	user.ResetTokenExpires = nil

	// Remove token from storage
	tokenMutex.Lock()
	delete(passwordResetTokens, req.Token)
	tokenMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}

// POST /api/auth/verify-email - Verify email with token
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Try to get token from query parameter as fallback
		req.Token = c.Query("token")
		if req.Token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token required"})
			return
		}
	}

	// Validate token
	tokenMutex.RLock()
	data, exists := verificationTokens[req.Token]
	tokenMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	// Check expiry
	if time.Now().After(data.ExpiresAt) {
		// Clean up expired token
		tokenMutex.Lock()
		delete(verificationTokens, req.Token)
		tokenMutex.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token has expired"})
		return
	}

	// Get user
	user, exists := h.storage.Users[data.UserID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Mark email as verified
	user.EmailVerified = true

	// Remove token from storage
	tokenMutex.Lock()
	delete(verificationTokens, req.Token)
	tokenMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully", "emailVerified": true})
}

// POST /api/auth/resend-verification - Resend verification email
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	var req ResendVerificationRequest
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
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists and is unverified, a verification link will be sent"})
		return
	}

	// Check if already verified
	if user.EmailVerified {
		c.JSON(http.StatusOK, gin.H{"message": "Email is already verified"})
		return
	}

	// Generate new verification token
	verifyToken, err := generateSecureToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
		return
	}

	// Remove any existing verification tokens for this user
	tokenMutex.Lock()
	for token, data := range verificationTokens {
		if data.UserID == user.ID {
			delete(verificationTokens, token)
		}
	}
	verificationTokens[verifyToken] = tokenData{
		UserID:    user.ID,
		Email:     user.Email,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	tokenMutex.Unlock()

	// Send verification email (non-blocking)
	go func() {
		if h.emailService != nil {
			h.emailService.SendVerificationEmail(user.Email, user.Name, verifyToken)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists and is unverified, a verification link will be sent"})
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
		ID:            uuid.New(),
		Email:         req.Email,
		Name:          req.Name,
		Avatar:        &req.Avatar,
		Role:          models.RoleClient,
		Location:      models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:     time.Now(),
		LastActive:    time.Now(),
		AuthProvider:  models.AuthProviderGoogle, // Default to Google for Firebase sync
		EmailVerified: true,                      // Firebase users are considered verified
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
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
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

// GoogleTokenInfo represents the response from Google's tokeninfo endpoint
type GoogleTokenInfo struct {
	Iss           string `json:"iss"`
	Azp           string `json:"azp"`
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Locale        string `json:"locale"`
	Iat           string `json:"iat"`
	Exp           string `json:"exp"`
	Alg           string `json:"alg"`
	Kid           string `json:"kid"`
	Typ           string `json:"typ"`
}

// POST /api/auth/google - Sign in with Google
func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var req GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "Google OAuth not configured",
			"message": "Set GOOGLE_CLIENT_ID environment variable to enable Google authentication",
		})
		return
	}

	// Verify the ID token with Google's tokeninfo endpoint
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	tokenInfoURL := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", req.IDToken)
	httpReq, err := http.NewRequestWithContext(ctx, "GET", tokenInfoURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification request"})
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify Google token"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google ID token", "details": string(body)})
		return
	}

	var tokenInfo GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Google token info"})
		return
	}

	// Verify the audience matches our client ID
	if tokenInfo.Aud != googleClientID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token was not issued for this application"})
		return
	}

	// Verify the issuer
	if tokenInfo.Iss != "https://accounts.google.com" && tokenInfo.Iss != "accounts.google.com" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token issuer"})
		return
	}

	// Find or create user
	user, isNewUser := h.findOrCreateOAuthUser(
		tokenInfo.Email,
		tokenInfo.Name,
		tokenInfo.Picture,
		models.AuthProviderGoogle,
	)

	// Generate tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, OAuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		IsNewUser:    isNewUser,
	})
}

// AppleTokenClaims represents the claims in an Apple identity token
type AppleTokenClaims struct {
	Iss            string `json:"iss"`
	Aud            string `json:"aud"`
	Exp            int64  `json:"exp"`
	Iat            int64  `json:"iat"`
	Sub            string `json:"sub"`
	Email          string `json:"email"`
	EmailVerified  any    `json:"email_verified"` // Can be bool or string
	IsPrivateEmail any    `json:"is_private_email"`
	RealUserStatus int    `json:"real_user_status"`
	jwt.RegisteredClaims
}

// POST /api/auth/apple - Sign in with Apple
func (h *AuthHandler) AppleAuth(c *gin.Context) {
	var req AppleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appleClientID := os.Getenv("APPLE_CLIENT_ID")
	if appleClientID == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "Apple Sign-In not configured",
			"message": "Set APPLE_CLIENT_ID environment variable to enable Apple authentication",
		})
		return
	}

	// Parse the identity token (without verification for now - in production, verify with Apple's public keys)
	// The token is a JWT that we need to decode
	token, _, err := jwt.NewParser().ParseUnverified(req.IdentityToken, &AppleTokenClaims{})
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to parse Apple identity token"})
		return
	}

	claims, ok := token.Claims.(*AppleTokenClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Apple token claims"})
		return
	}

	// Verify the issuer
	if claims.Iss != "https://appleid.apple.com" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token issuer"})
		return
	}

	// Verify the audience matches our client ID
	if claims.Aud != appleClientID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token was not issued for this application"})
		return
	}

	// Check expiration
	if time.Now().Unix() > claims.Exp {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Apple identity token has expired"})
		return
	}

	// Get email - Apple may not provide email on subsequent sign-ins
	email := claims.Email
	if email == "" && req.Email != "" {
		email = req.Email
	}

	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required for Apple Sign-In"})
		return
	}

	// Get name - Apple only provides name on first sign-in
	name := req.FullName
	if name == "" {
		name = "Apple User"
	}

	// Find or create user
	user, isNewUser := h.findOrCreateOAuthUser(email, name, "", models.AuthProviderApple)

	// Store Apple's unique user identifier
	appleUserID := claims.Sub
	user.FirebaseUID = &appleUserID // Reusing this field for Apple's sub claim

	// Generate tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, OAuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		IsNewUser:    isNewUser,
	})
}

// Helper function to create or update OAuth user
func (h *AuthHandler) findOrCreateOAuthUser(email, name, avatar string, provider models.AuthProvider) (*models.User, bool) {
	// Check if user already exists by email
	for _, user := range h.storage.Users {
		if strings.EqualFold(user.Email, email) {
			// Update existing user with latest OAuth info
			if name != "" && name != "Apple User" {
				user.Name = name
			}
			if avatar != "" {
				user.Avatar = &avatar
			}
			user.LastActive = time.Now()
			// Update auth provider if not already set or if linking
			if user.AuthProvider == models.AuthProviderEmail {
				// Keep as email but note the OAuth provider was used
			}
			return user, false // Not a new user
		}
	}

	// Create new user
	user := &models.User{
		ID:            uuid.New(),
		Email:         email,
		Name:          name,
		Role:          models.RoleClient,
		Location:      models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:     time.Now(),
		LastActive:    time.Now(),
		AuthProvider:  provider,
		EmailVerified: true, // OAuth users have verified emails
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

// ============================================================================
// Phone Authentication
// ============================================================================

// Phone auth request types
type PhoneSendCodeRequest struct {
	PhoneNumber string `json:"phoneNumber" binding:"required"`
}

type PhoneVerifyRequest struct {
	VerificationID string `json:"verificationId" binding:"required"`
	Code           string `json:"code" binding:"required"`
}

type PhoneSendCodeResponse struct {
	VerificationID string `json:"verificationId"`
	ExpiresAt      int64  `json:"expiresAt"`
	Message        string `json:"message"`
}

// Phone verification storage
var (
	phoneVerifications     = make(map[string]phoneVerificationData) // verificationId -> data
	phoneVerificationMutex sync.RWMutex
	phoneRateLimit         = make(map[string]time.Time) // phoneNumber -> last request time
	phoneRateLimitMutex    sync.RWMutex
)

type phoneVerificationData struct {
	PhoneNumber string
	Code        string
	ExpiresAt   time.Time
	Attempts    int
}

// generateVerificationCode generates a 6-digit verification code
func generateVerificationCode() string {
	code := ""
	for i := 0; i < 6; i++ {
		b := make([]byte, 1)
		rand.Read(b)
		code += fmt.Sprintf("%d", b[0]%10)
	}
	return code
}

// POST /api/auth/phone/send-code - Send phone verification code
func (h *AuthHandler) PhoneSendCode(c *gin.Context) {
	var req PhoneSendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate phone number format (E.164)
	phoneRegex := `^\+[1-9]\d{6,14}$`
	matched, _ := regexp.MatchString(phoneRegex, req.PhoneNumber)
	if !matched {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid phone number format. Use E.164 format (e.g., +14155551234)",
		})
		return
	}

	// Rate limiting: only allow one request per phone number per 60 seconds
	phoneRateLimitMutex.RLock()
	lastRequest, exists := phoneRateLimit[req.PhoneNumber]
	phoneRateLimitMutex.RUnlock()

	if exists && time.Since(lastRequest) < 60*time.Second {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":      "Please wait before requesting another code",
			"retryAfter": 60 - int(time.Since(lastRequest).Seconds()),
		})
		return
	}

	// Update rate limit
	phoneRateLimitMutex.Lock()
	phoneRateLimit[req.PhoneNumber] = time.Now()
	phoneRateLimitMutex.Unlock()

	// Generate verification ID and code
	verificationID, err := generateSecureToken(16)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification ID"})
		return
	}

	code := generateVerificationCode()
	expiresAt := time.Now().Add(10 * time.Minute) // Code expires in 10 minutes

	// Store verification data
	phoneVerificationMutex.Lock()
	// Clean up any existing verifications for this phone number
	for id, data := range phoneVerifications {
		if data.PhoneNumber == req.PhoneNumber {
			delete(phoneVerifications, id)
		}
	}
	phoneVerifications[verificationID] = phoneVerificationData{
		PhoneNumber: req.PhoneNumber,
		Code:        code,
		ExpiresAt:   expiresAt,
		Attempts:    0,
	}
	phoneVerificationMutex.Unlock()

	// In production, send SMS via Twilio/Firebase/etc.
	// For development, we'll log the code (and in dev mode, return it)
	devMode := os.Getenv("DEV_MODE") == "true"

	// TODO: Implement SMS sending via Twilio or similar service
	// twilioClient.SendSMS(req.PhoneNumber, fmt.Sprintf("Your Cloud Clips verification code is: %s", code))

	// Log for development
	fmt.Printf("[Phone Auth] Verification code for %s: %s (expires: %s)\n",
		req.PhoneNumber, code, expiresAt.Format(time.RFC3339))

	response := PhoneSendCodeResponse{
		VerificationID: verificationID,
		ExpiresAt:      expiresAt.Unix(),
		Message:        "Verification code sent",
	}

	// In dev mode, include the code in the response for testing
	if devMode {
		c.JSON(http.StatusOK, gin.H{
			"verificationId": response.VerificationID,
			"expiresAt":      response.ExpiresAt,
			"message":        response.Message,
			"devCode":        code, // Only in dev mode!
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// POST /api/auth/phone/verify - Verify phone code and authenticate
func (h *AuthHandler) PhoneVerify(c *gin.Context) {
	var req PhoneVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate code format
	if len(req.Code) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification code format"})
		return
	}

	// Get verification data
	phoneVerificationMutex.Lock()
	data, exists := phoneVerifications[req.VerificationID]
	if !exists {
		phoneVerificationMutex.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification ID"})
		return
	}

	// Check expiry
	if time.Now().After(data.ExpiresAt) {
		delete(phoneVerifications, req.VerificationID)
		phoneVerificationMutex.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification code has expired"})
		return
	}

	// Check attempts (max 5 attempts)
	if data.Attempts >= 5 {
		delete(phoneVerifications, req.VerificationID)
		phoneVerificationMutex.Unlock()
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many attempts. Please request a new code"})
		return
	}

	// Increment attempts
	data.Attempts++
	phoneVerifications[req.VerificationID] = data

	// Verify code
	if data.Code != req.Code {
		phoneVerificationMutex.Unlock()
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "Invalid verification code",
			"attemptsRemaining": 5 - data.Attempts,
		})
		return
	}

	// Code verified - remove from storage
	phoneNumber := data.PhoneNumber
	delete(phoneVerifications, req.VerificationID)
	phoneVerificationMutex.Unlock()

	// Find or create user by phone number
	user, isNewUser := h.findOrCreatePhoneUser(phoneNumber)

	// Generate tokens
	accessToken, refreshToken, expiresAt, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":         user,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"expiresAt":    expiresAt,
		"isNewUser":    isNewUser,
	})
}

// Helper function to find or create user by phone number
func (h *AuthHandler) findOrCreatePhoneUser(phoneNumber string) (*models.User, bool) {
	// Check if user already exists by phone number
	for _, user := range h.storage.Users {
		if user.Phone == phoneNumber {
			// Update last active
			user.LastActive = time.Now()
			return user, false // Not a new user
		}
	}

	// Create new user with phone number
	// Generate a placeholder name from phone number
	lastFour := phoneNumber[len(phoneNumber)-4:]
	user := &models.User{
		ID:            uuid.New(),
		Email:         "", // Email can be added later
		Phone:         phoneNumber,
		Name:          fmt.Sprintf("User %s", lastFour),
		Role:          models.RoleClient,
		Location:      models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:     time.Now(),
		LastActive:    time.Now(),
		AuthProvider:  models.AuthProviderPhone,
		EmailVerified: false, // Phone users need to verify email separately if they want to add one
		NotificationPrefs: models.NotificationPrefs{
			Push:  true,
			SMS:   true,
			Email: false, // No email yet
		},
	}

	h.storage.Users[user.ID] = user
	return user, true // Is a new user
}
