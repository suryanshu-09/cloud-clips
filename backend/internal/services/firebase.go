package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// FirebaseService handles Firebase Admin SDK operations
// including token verification and push notifications via FCM
type FirebaseService struct {
	projectID       string
	credentialsFile string
	fcmServerKey    string
	httpClient      *http.Client
}

// FirebaseConfig holds Firebase configuration
type FirebaseConfig struct {
	ProjectID       string
	CredentialsFile string
	FCMServerKey    string
}

// FirebaseToken represents a decoded Firebase ID token
type FirebaseToken struct {
	UID           string                 `json:"uid"`
	Email         string                 `json:"email"`
	EmailVerified bool                   `json:"email_verified"`
	Name          string                 `json:"name"`
	Picture       string                 `json:"picture"`
	IssuedAt      int64                  `json:"iat"`
	ExpiresAt     int64                  `json:"exp"`
	Claims        map[string]interface{} `json:"claims"`
}

// FCMMessage represents a Firebase Cloud Messaging message
type FCMMessage struct {
	Token        string            `json:"token,omitempty"`
	Topic        string            `json:"topic,omitempty"`
	Notification *FCMNotification  `json:"notification,omitempty"`
	Data         map[string]string `json:"data,omitempty"`
	Android      *FCMAndroidConfig `json:"android,omitempty"`
	APNS         *FCMAPNSConfig    `json:"apns,omitempty"`
}

// FCMNotification represents notification content
type FCMNotification struct {
	Title    string `json:"title,omitempty"`
	Body     string `json:"body,omitempty"`
	ImageURL string `json:"image,omitempty"`
}

// FCMAndroidConfig represents Android-specific configuration
type FCMAndroidConfig struct {
	Priority     string            `json:"priority,omitempty"` // high, normal
	TTL          string            `json:"ttl,omitempty"`      // e.g., "86400s"
	Notification *FCMNotification  `json:"notification,omitempty"`
	Data         map[string]string `json:"data,omitempty"`
}

// FCMAPNSConfig represents iOS-specific configuration
type FCMAPNSConfig struct {
	Headers map[string]string `json:"headers,omitempty"`
	Payload *FCMAPNSPayload   `json:"payload,omitempty"`
}

// FCMAPNSPayload represents iOS notification payload
type FCMAPNSPayload struct {
	Aps *FCMAPSAlert `json:"aps,omitempty"`
}

// FCMAPSAlert represents iOS alert configuration
type FCMAPSAlert struct {
	Alert            interface{} `json:"alert,omitempty"`
	Badge            int         `json:"badge,omitempty"`
	Sound            string      `json:"sound,omitempty"`
	ContentAvailable int         `json:"content-available,omitempty"`
	MutableContent   int         `json:"mutable-content,omitempty"`
}

// FCMSendResponse represents the response from FCM send
type FCMSendResponse struct {
	Name string `json:"name"`
}

// FCMError represents an FCM error response
type FCMError struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

// NewFirebaseService creates a new Firebase service instance
func NewFirebaseService(config FirebaseConfig) *FirebaseService {
	return &FirebaseService{
		projectID:       config.ProjectID,
		credentialsFile: config.CredentialsFile,
		fcmServerKey:    config.FCMServerKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// IsConfigured returns true if Firebase is properly configured
func (f *FirebaseService) IsConfigured() bool {
	return f.projectID != "" && (f.credentialsFile != "" || f.fcmServerKey != "")
}

// VerifyIDToken verifies a Firebase ID token
// Note: In production, use the official Firebase Admin SDK
// This is a simplified implementation for development
func (f *FirebaseService) VerifyIDToken(ctx context.Context, idToken string) (*FirebaseToken, error) {
	if idToken == "" {
		return nil, errors.New("empty ID token")
	}

	// Parse the JWT to extract claims
	// Note: This is a simplified implementation. In production,
	// you should use the Firebase Admin SDK which properly verifies:
	// - Token signature using Google's public keys
	// - Token expiration
	// - Issuer and audience claims
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// Decode the payload (second part)
	payload, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode token payload: %w", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse token claims: %w", err)
	}

	// Extract common claims
	token := &FirebaseToken{
		Claims: claims,
	}

	if uid, ok := claims["sub"].(string); ok {
		token.UID = uid
	} else if uid, ok := claims["user_id"].(string); ok {
		token.UID = uid
	}

	if email, ok := claims["email"].(string); ok {
		token.Email = email
	}

	if verified, ok := claims["email_verified"].(bool); ok {
		token.EmailVerified = verified
	}

	if name, ok := claims["name"].(string); ok {
		token.Name = name
	}

	if picture, ok := claims["picture"].(string); ok {
		token.Picture = picture
	}

	if iat, ok := claims["iat"].(float64); ok {
		token.IssuedAt = int64(iat)
	}

	if exp, ok := claims["exp"].(float64); ok {
		token.ExpiresAt = int64(exp)
	}

	// Check expiration
	if token.ExpiresAt > 0 && token.ExpiresAt < time.Now().Unix() {
		return nil, errors.New("token has expired")
	}

	// In development mode, accept the token without signature verification
	// In production, use Firebase Admin SDK for proper verification
	if os.Getenv("ENVIRONMENT") != "production" {
		return token, nil
	}

	// For production, you should verify the token with Google's public keys
	// This would require fetching keys from:
	// https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
	// and verifying the RS256 signature

	return token, nil
}

// SendNotification sends a push notification via FCM
func (f *FirebaseService) SendNotification(ctx context.Context, message *FCMMessage) error {
	if !f.IsConfigured() {
		return errors.New("Firebase is not configured")
	}

	// Use FCM HTTP v1 API if we have credentials file
	if f.credentialsFile != "" {
		return f.sendWithHTTPv1(ctx, message)
	}

	// Fall back to legacy FCM API if we have server key
	if f.fcmServerKey != "" {
		return f.sendWithLegacyAPI(ctx, message)
	}

	return errors.New("no FCM credentials available")
}

// sendWithHTTPv1 sends notification using FCM HTTP v1 API
func (f *FirebaseService) sendWithHTTPv1(ctx context.Context, message *FCMMessage) error {
	// Get access token from service account
	accessToken, err := f.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to get access token: %w", err)
	}

	// Build the request
	url := fmt.Sprintf("https://fcm.googleapis.com/v1/projects/%s/messages:send", f.projectID)

	body := map[string]interface{}{
		"message": message,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		var fcmErr FCMError
		if err := json.Unmarshal(bodyBytes, &fcmErr); err == nil {
			return fmt.Errorf("FCM error: %s (code: %d)", fcmErr.Error.Message, fcmErr.Error.Code)
		}
		return fmt.Errorf("FCM request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// sendWithLegacyAPI sends notification using legacy FCM API
func (f *FirebaseService) sendWithLegacyAPI(ctx context.Context, message *FCMMessage) error {
	url := "https://fcm.googleapis.com/fcm/send"

	body := map[string]interface{}{
		"to":           message.Token,
		"notification": message.Notification,
		"data":         message.Data,
	}

	if message.Topic != "" {
		body["to"] = "/topics/" + message.Topic
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "key="+f.fcmServerKey)

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("FCM request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// SendMulticastNotification sends notifications to multiple devices
func (f *FirebaseService) SendMulticastNotification(ctx context.Context, tokens []string, notification *FCMNotification, data map[string]string) error {
	var lastErr error
	successCount := 0

	for _, token := range tokens {
		message := &FCMMessage{
			Token:        token,
			Notification: notification,
			Data:         data,
		}

		if err := f.SendNotification(ctx, message); err != nil {
			lastErr = err
		} else {
			successCount++
		}
	}

	if successCount == 0 && lastErr != nil {
		return lastErr
	}

	return nil
}

// SendTopicNotification sends a notification to a topic
func (f *FirebaseService) SendTopicNotification(ctx context.Context, topic string, notification *FCMNotification, data map[string]string) error {
	message := &FCMMessage{
		Topic:        topic,
		Notification: notification,
		Data:         data,
	}

	return f.SendNotification(ctx, message)
}

// getAccessToken gets an OAuth2 access token from service account credentials
func (f *FirebaseService) getAccessToken(ctx context.Context) (string, error) {
	// In a full implementation, you would:
	// 1. Read the service account JSON file
	// 2. Create a JWT signed with the private key
	// 3. Exchange it for an access token via OAuth2
	//
	// For now, we'll use a simplified approach or return an error
	// suggesting to use the FCM server key instead

	if f.credentialsFile == "" {
		return "", errors.New("credentials file not configured")
	}

	// Read credentials file
	credData, err := os.ReadFile(f.credentialsFile)
	if err != nil {
		return "", fmt.Errorf("failed to read credentials file: %w", err)
	}

	var creds struct {
		Type         string `json:"type"`
		ClientEmail  string `json:"client_email"`
		PrivateKey   string `json:"private_key"`
		PrivateKeyID string `json:"private_key_id"`
		TokenURI     string `json:"token_uri"`
	}

	if err := json.Unmarshal(credData, &creds); err != nil {
		return "", fmt.Errorf("failed to parse credentials: %w", err)
	}

	// For full OAuth2 implementation, you would create a JWT and exchange it
	// For simplicity, we recommend using the FCM server key in development
	// or using the official Go Firebase Admin SDK in production

	return "", errors.New("OAuth2 token exchange not implemented - use FCM_SERVER_KEY instead")
}

// Helper function for base64 URL decoding
func base64URLDecode(s string) ([]byte, error) {
	// Add padding if necessary
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}

	// Replace URL-safe characters
	s = strings.ReplaceAll(s, "-", "+")
	s = strings.ReplaceAll(s, "_", "/")

	// Decode using base64
	return base64.StdEncoding.DecodeString(s)
}

// Common notification builders

// BuildAppointmentReminderNotification creates an appointment reminder notification
func BuildAppointmentReminderNotification(barberName string, appointmentTime time.Time) *FCMMessage {
	return &FCMMessage{
		Notification: &FCMNotification{
			Title: "Appointment Reminder",
			Body:  fmt.Sprintf("Your appointment with %s is in 1 hour", barberName),
		},
		Data: map[string]string{
			"type":      "appointment_reminder",
			"timestamp": appointmentTime.Format(time.RFC3339),
		},
	}
}

// BuildAppointmentConfirmedNotification creates an appointment confirmed notification
func BuildAppointmentConfirmedNotification(barberName string, appointmentID string) *FCMMessage {
	return &FCMMessage{
		Notification: &FCMNotification{
			Title: "Appointment Confirmed",
			Body:  fmt.Sprintf("%s has confirmed your appointment", barberName),
		},
		Data: map[string]string{
			"type":          "appointment_confirmed",
			"appointmentId": appointmentID,
		},
	}
}

// BuildNewMessageNotification creates a new chat message notification
func BuildNewMessageNotification(senderName string, preview string, appointmentID string) *FCMMessage {
	if len(preview) > 50 {
		preview = preview[:47] + "..."
	}

	return &FCMMessage{
		Notification: &FCMNotification{
			Title: senderName,
			Body:  preview,
		},
		Data: map[string]string{
			"type":          "new_message",
			"appointmentId": appointmentID,
		},
	}
}

// BuildPaymentReceivedNotification creates a payment received notification
func BuildPaymentReceivedNotification(amount string, appointmentID string) *FCMMessage {
	return &FCMMessage{
		Notification: &FCMNotification{
			Title: "Payment Received",
			Body:  fmt.Sprintf("Your payment of %s has been received", amount),
		},
		Data: map[string]string{
			"type":          "payment_received",
			"appointmentId": appointmentID,
		},
	}
}

// BuildPromoNotification creates a promotional notification
func BuildPromoNotification(title, body, promoCode string) *FCMMessage {
	return &FCMMessage{
		Notification: &FCMNotification{
			Title: title,
			Body:  body,
		},
		Data: map[string]string{
			"type":      "promo",
			"promoCode": promoCode,
		},
	}
}
