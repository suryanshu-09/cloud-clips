package interfaces

import (
	"cloud-clips/internal/models"
	"context"

	"github.com/google/uuid"
)

// StorageInterface defines the contract for storage implementations
type StorageInterface interface {
	// User operations
	GetUser(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByFirebaseUID(ctx context.Context, firebaseUID string) (*models.User, error)
	GetUsers(ctx context.Context) ([]*models.User, error)
	CreateUser(ctx context.Context, user *models.User) error
	UpdateUser(ctx context.Context, user *models.User) error
	DeleteUser(ctx context.Context, id uuid.UUID) error

	// Barber profile operations
	GetBarberProfile(ctx context.Context, id uuid.UUID) (*models.BarberProfile, error)
	GetBarberProfileByUserID(ctx context.Context, userID uuid.UUID) (*models.BarberProfile, error)
	GetBarberProfiles(ctx context.Context) ([]*models.BarberProfile, error)
	CreateBarberProfile(ctx context.Context, profile *models.BarberProfile) error
	UpdateBarberProfile(ctx context.Context, profile *models.BarberProfile) error
	DeleteBarberProfile(ctx context.Context, id uuid.UUID) error
	SearchBarbers(ctx context.Context, lat, lng, radiusKm float64) ([]*models.BarberProfile, error)

	// Appointment operations
	GetAppointment(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	GetAppointments(ctx context.Context) ([]*models.Appointment, error)
	GetUserAppointments(ctx context.Context, userID uuid.UUID) ([]*models.Appointment, error)
	GetBarberAppointments(ctx context.Context, barberID uuid.UUID) ([]*models.Appointment, error)
	CreateAppointment(ctx context.Context, appointment *models.Appointment) error
	UpdateAppointment(ctx context.Context, appointment *models.Appointment) error
	DeleteAppointment(ctx context.Context, id uuid.UUID) error

	// Review operations
	GetReview(ctx context.Context, id uuid.UUID) (*models.Review, error)
	GetReviewByAppointmentID(ctx context.Context, appointmentID uuid.UUID) (*models.Review, error)
	GetReviews(ctx context.Context) ([]*models.Review, error)
	GetBarberReviews(ctx context.Context, barberID uuid.UUID) ([]*models.Review, error)
	GetClientReviews(ctx context.Context, clientID uuid.UUID) ([]*models.Review, error)
	CreateReview(ctx context.Context, review *models.Review) error
	UpdateReview(ctx context.Context, review *models.Review) error
	DeleteReview(ctx context.Context, id uuid.UUID) error

	// Product operations
	GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error)
	GetProducts(ctx context.Context) ([]*models.Product, error)
	GetProductsByCategory(ctx context.Context, category string) ([]*models.Product, error)
	GetProductsByBarberID(ctx context.Context, barberID uuid.UUID) ([]*models.Product, error)
	CreateProduct(ctx context.Context, product *models.Product) error
	UpdateProduct(ctx context.Context, product *models.Product) error
	DeleteProduct(ctx context.Context, id uuid.UUID) error

	// Order operations
	GetOrder(ctx context.Context, id uuid.UUID) (*models.Order, error)
	GetOrders(ctx context.Context) ([]*models.Order, error)
	GetUserOrders(ctx context.Context, userID uuid.UUID) ([]*models.Order, error)
	CreateOrder(ctx context.Context, order *models.Order) error
	UpdateOrder(ctx context.Context, order *models.Order) error
	DeleteOrder(ctx context.Context, id uuid.UUID) error

	// Coupon operations
	GetCoupon(ctx context.Context, id uuid.UUID) (*models.Coupon, error)
	GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error)
	GetCoupons(ctx context.Context) ([]*models.Coupon, error)
	GetActiveCoupons(ctx context.Context) ([]*models.Coupon, error)
	CreateCoupon(ctx context.Context, coupon *models.Coupon) error
	UpdateCoupon(ctx context.Context, coupon *models.Coupon) error
	DeleteCoupon(ctx context.Context, id uuid.UUID) error

	// Chat message operations
	GetChatMessage(ctx context.Context, id uuid.UUID) (*models.ChatMessage, error)
	GetChatMessages(ctx context.Context) ([]*models.ChatMessage, error)
	GetChatMessagesByAppointmentID(ctx context.Context, appointmentID uuid.UUID) ([]*models.ChatMessage, error)
	GetChatThreads(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
	GetUnreadMessageCount(ctx context.Context, userID uuid.UUID) (int, error)
	CreateChatMessage(ctx context.Context, message *models.ChatMessage) error
	UpdateChatMessage(ctx context.Context, message *models.ChatMessage) error
	MarkMessagesAsRead(ctx context.Context, userID, appointmentID uuid.UUID) error
	DeleteChatMessage(ctx context.Context, id uuid.UUID) error

	// Notification operations
	GetNotification(ctx context.Context, id uuid.UUID) (*models.Notification, error)
	GetNotifications(ctx context.Context) ([]*models.Notification, error)
	GetUserNotifications(ctx context.Context, userID uuid.UUID) ([]*models.Notification, error)
	GetUnreadNotificationCount(ctx context.Context, userID uuid.UUID) (int, error)
	CreateNotification(ctx context.Context, notification *models.Notification) error
	UpdateNotification(ctx context.Context, notification *models.Notification) error
	MarkNotificationAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllNotificationsAsRead(ctx context.Context, userID uuid.UUID) error
	DeleteNotification(ctx context.Context, id uuid.UUID) error

	// Health check
	Ping(ctx context.Context) error
	Close() error
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
