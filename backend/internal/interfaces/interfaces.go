package interfaces

import (
	"cloud-clips/internal/models"
	"github.com/google/uuid"
)

// StorageInterface defines the contract for storage implementations
type StorageInterface interface {
	// User operations
	GetUser(id uuid.UUID) (*models.User, error)
	GetUsers() ([]*models.User, error)
	CreateUser(user *models.User) error
	UpdateUser(user *models.User) error
	DeleteUser(id uuid.UUID) error

	// Barber profile operations
	GetBarberProfile(id uuid.UUID) (*models.BarberProfile, error)
	GetBarberProfiles() ([]*models.BarberProfile, error)
	CreateBarberProfile(profile *models.BarberProfile) error
	UpdateBarberProfile(profile *models.BarberProfile) error
	DeleteBarberProfile(id uuid.UUID) error

	// Appointment operations
	GetAppointment(id uuid.UUID) (*models.Appointment, error)
	GetAppointments() ([]*models.Appointment, error)
	CreateAppointment(appointment *models.Appointment) error
	UpdateAppointment(appointment *models.Appointment) error
	DeleteAppointment(id uuid.UUID) error

	// Search operations
	SearchBarbers(lat, lng, radius float64) ([]*models.BarberProfile, error)
	GetUserAppointments(userID uuid.UUID) ([]*models.Appointment, error)
	GetBarberAppointments(barberID uuid.UUID) ([]*models.Appointment, error)
}

// AuthServiceInterface defines authentication operations
type AuthServiceInterface interface {
	GenerateToken(userID uuid.UUID) (string, error)
	ValidateToken(token string) (uuid.UUID, error)
	RefreshToken(refreshToken string) (string, error)
}

// NotificationServiceInterface defines notification operations
type NotificationServiceInterface interface {
	SendPushNotification(userID uuid.UUID, title, body string) error
	SendSMSNotification(phoneNumber, message string) error
	SendEmailNotification(email, subject, body string) error
}

// PaymentServiceInterface defines payment operations
type PaymentServiceInterface interface {
	CreatePaymentIntent(amount float64, currency string) (string, error)
	ConfirmPayment(paymentIntentID string) error
	RefundPayment(paymentID string) error
}
