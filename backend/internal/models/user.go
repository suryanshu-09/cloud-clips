package models

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleClient UserRole = "client"
	RoleBarber UserRole = "barber"
	RoleAdmin  UserRole = "admin"
)

type AuthProvider string

const (
	AuthProviderEmail    AuthProvider = "email"
	AuthProviderGoogle   AuthProvider = "google"
	AuthProviderApple    AuthProvider = "apple"
	AuthProviderFirebase AuthProvider = "firebase"
	AuthProviderPhone    AuthProvider = "phone"
)

type User struct {
	ID                uuid.UUID         `json:"id" bson:"_id"`
	Email             string            `json:"email" bson:"email"`
	Phone             string            `json:"phone" bson:"phone"`
	Name              string            `json:"name" bson:"name"`
	Avatar            *string           `json:"avatar,omitempty" bson:"avatar,omitempty"`
	PasswordHash      *string           `json:"-" bson:"passwordHash,omitempty"`
	Role              UserRole          `json:"role" bson:"role"`
	Location          Location          `json:"location" bson:"location"`
	CreatedAt         time.Time         `json:"createdAt" bson:"createdAt"`
	LastActive        time.Time         `json:"lastActive" bson:"lastActive"`
	NotificationPrefs NotificationPrefs `json:"notificationPrefs" bson:"notificationPrefs"`
	AuthProvider      AuthProvider      `json:"authProvider" bson:"authProvider"`
	StripeCustomerID  *string           `json:"stripeCustomerId,omitempty" bson:"stripeCustomerId,omitempty"`
	FirebaseUID       *string           `json:"firebaseUid,omitempty" bson:"firebaseUid,omitempty"`
	FCMToken          *string           `json:"fcmToken,omitempty" bson:"fcmToken,omitempty"`
	EmailVerified     bool              `json:"emailVerified" bson:"emailVerified"`
	ResetToken        *string           `json:"-" bson:"resetToken,omitempty"`
	ResetTokenExpires *time.Time        `json:"-" bson:"resetTokenExpires,omitempty"`
	Banned            bool              `json:"banned" bson:"banned"`
	BannedAt          *time.Time        `json:"bannedAt,omitempty" bson:"bannedAt,omitempty"`
	BannedReason      *string           `json:"bannedReason,omitempty" bson:"bannedReason,omitempty"`
}

type Location struct {
	Type        string    `json:"type" bson:"type"`
	Coordinates []float64 `json:"coordinates" bson:"coordinates"`
}

type NotificationPrefs struct {
	Push  bool `json:"push" bson:"push"`
	SMS   bool `json:"sms" bson:"sms"`
	Email bool `json:"email" bson:"email"`
}
