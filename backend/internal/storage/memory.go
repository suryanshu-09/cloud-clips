package storage

import (
	"sync"
	"time"

	"cloud-clips/internal/models"
	"github.com/google/uuid"
)

type MemoryStorage struct {
	Users          map[uuid.UUID]*models.User
	BarberProfiles map[uuid.UUID]*models.BarberProfile
	Appointments   map[uuid.UUID]*models.Appointment
	Reviews        map[uuid.UUID]*models.Review
	Products       map[uuid.UUID]*models.Product
	Orders         map[uuid.UUID]*models.Order
	Coupons        map[uuid.UUID]*models.Coupon
	ChatMessages   map[uuid.UUID]*models.ChatMessage
	Notifications  map[uuid.UUID]*models.Notification
	mu             sync.RWMutex
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{
		Users:          make(map[uuid.UUID]*models.User),
		BarberProfiles: make(map[uuid.UUID]*models.BarberProfile),
		Appointments:   make(map[uuid.UUID]*models.Appointment),
		Reviews:        make(map[uuid.UUID]*models.Review),
		Products:       make(map[uuid.UUID]*models.Product),
		Orders:         make(map[uuid.UUID]*models.Order),
		Coupons:        make(map[uuid.UUID]*models.Coupon),
		ChatMessages:   make(map[uuid.UUID]*models.ChatMessage),
		Notifications:  make(map[uuid.UUID]*models.Notification),
	}
}

func (m *MemoryStorage) SeedMockData() {
	m.mu.Lock()
	defer m.mu.Unlock()

	clientID := uuid.New()
	barberID := uuid.New()

	m.Users[clientID] = &models.User{
		ID:                clientID,
		Email:             "john.doe@example.com",
		Phone:             "+1234567890",
		Name:              "John Doe",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{-74.0060, 40.7128}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	m.Users[barberID] = &models.User{
		ID:                barberID,
		Email:             "jane.smith@example.com",
		Phone:             "+0987654321",
		Name:              "Jane Smith",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{-73.935242, 40.730610}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	businessName := "Jane's Cuts"
	m.BarberProfiles[barberID] = &models.BarberProfile{
		ID:               barberID,
		UserID:           barberID,
		BusinessName:     &businessName,
		Bio:              "Professional barber with 10+ years of experience in modern cuts and classic styles.",
		Specialties:      []string{"Fade", "Beard Trim", "Classic Cut", "Modern Style"},
		Experience:       10,
		ServiceLocations: []models.ServiceLocation{models.ServiceLocationInSalon, models.ServiceLocationInHome},
		WorkingHours: map[string]models.WorkingHour{
			"monday":    {Start: "09:00", End: "18:00", IsAvailable: true},
			"tuesday":   {Start: "09:00", End: "18:00", IsAvailable: true},
			"wednesday": {Start: "09:00", End: "18:00", IsAvailable: true},
			"thursday":  {Start: "09:00", End: "18:00", IsAvailable: true},
			"friday":    {Start: "09:00", End: "18:00", IsAvailable: true},
			"saturday":  {Start: "10:00", End: "16:00", IsAvailable: true},
			"sunday":    {Start: "Closed", End: "Closed", IsAvailable: false},
		},
		Services: []models.Service{
			{Name: "Basic Cut", Price: 25.00, Duration: 30, Description: stringPtr("Simple haircut")},
			{Name: "Fade", Price: 35.00, Duration: 45, Description: stringPtr("Professional fade cut")},
			{Name: "Beard Trim", Price: 15.00, Duration: 15, Description: stringPtr("Beard shaping and trim")},
			{Name: "Full Service", Price: 50.00, Duration: 60, Description: stringPtr("Cut, beard trim, and hot towel")},
		},
		Gallery: []models.GalleryItem{
			{URL: "https://example.com/gallery1.jpg", Type: "after"},
			{URL: "https://example.com/gallery2.jpg", Type: "before"},
		},
		Rating:       4.8,
		TotalReviews: 127,
		IsVerified:   true,
		Location: models.LocationWithAddress{
			Type:        "Point",
			Coordinates: []float64{-73.935242, 40.730610},
			Address:     "123 Main St, Brooklyn, NY 11201",
		},
	}

	appointmentID := uuid.New()
	m.Appointments[appointmentID] = &models.Appointment{
		ID:              appointmentID,
		ClientID:        clientID,
		BarberID:        barberID,
		Status:          models.AppointmentStatusConfirmed,
		ServiceType:     "Fade",
		HairType:        models.HairTypeStraight,
		SpecialRequests: stringPtr("Make it a low fade"),
		Location: models.AppointmentLocation{
			Type:        models.LocationTypeInSalon,
			Address:     stringPtr("123 Main St, Brooklyn, NY 11201"),
			Coordinates: []float64{-73.935242, 40.730610},
		},
		ScheduledFor:  time.Now().Add(24 * time.Hour),
		Duration:      45,
		Price:         35.00,
		PaymentStatus: models.PaymentStatusCompleted,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	reviewID := uuid.New()
	m.Reviews[reviewID] = &models.Review{
		ID:            reviewID,
		AppointmentID: appointmentID,
		ClientID:      clientID,
		BarberID:      barberID,
		Rating:        5,
		Comment:       stringPtr("Amazing cut! Jane really knows what she's doing."),
		CreatedAt:     time.Now(),
	}

	productID := uuid.New()
	m.Products[productID] = &models.Product{
		ID:           productID,
		Name:         "Premium Pomade",
		Description:  "High-quality pomade for all hair types",
		Category:     "Styling",
		Price:        24.99,
		Images:       []string{"https://example.com/pomade1.jpg"},
		Stock:        50,
		Rating:       4.5,
		TotalReviews: 23,
		BarberID:     &barberID,
		Specs: map[string]string{
			"size":  "4oz",
			"hold":  "Medium",
			"shine": "Matte",
		},
	}

	couponID := uuid.New()
	m.Coupons[couponID] = &models.Coupon{
		ID:         couponID,
		Code:       "WELCOME20",
		Type:       models.CouponTypePercentage,
		Value:      20.0,
		MinAmount:  float64Ptr(50.0),
		ValidFrom:  time.Now(),
		ValidUntil: time.Now().Add(30 * 24 * time.Hour),
		UsageLimit: intPtr(100),
		UsageCount: 15,
		ApplicableTo: models.ApplicableTo{
			Services: true,
			Products: true,
		},
	}

	chatID := uuid.New()
	m.ChatMessages[chatID] = &models.ChatMessage{
		ID:            chatID,
		AppointmentID: appointmentID,
		SenderID:      clientID,
		ReceiverID:    barberID,
		Content:       "Hi! I'm running 5 minutes late, is that okay?",
		CreatedAt:     time.Now().Add(-2 * time.Hour),
	}

	notificationID := uuid.New()
	m.Notifications[notificationID] = &models.Notification{
		ID:        notificationID,
		UserID:    clientID,
		Type:      models.NotificationTypeAppointment,
		Title:     "Appointment Reminder",
		Body:      "Your appointment with Jane Smith is tomorrow at 2:00 PM",
		Data:      map[string]any{"appointmentId": appointmentID.String()},
		IsRead:    false,
		CreatedAt: time.Now(),
	}
}

func stringPtr(s string) *string {
	return &s
}

func float64Ptr(f float64) *float64 {
	return &f
}

func intPtr(i int) *int {
	return &i
}
