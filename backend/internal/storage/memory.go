package storage

import (
	"context"
	"math"
	"sync"
	"time"

	"cloud-clips/internal/interfaces"
	"cloud-clips/internal/models"

	"github.com/google/uuid"
)

// Ensure MemoryStorage implements StorageInterface
var _ interfaces.StorageInterface = (*MemoryStorage)(nil)

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

// ========== User Operations ==========

func (m *MemoryStorage) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, exists := m.Users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (m *MemoryStorage) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, user := range m.Users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (m *MemoryStorage) GetUserByFirebaseUID(ctx context.Context, firebaseUID string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, user := range m.Users {
		if user.FirebaseUID != nil && *user.FirebaseUID == firebaseUID {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (m *MemoryStorage) GetUsers(ctx context.Context) ([]*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	users := make([]*models.User, 0, len(m.Users))
	for _, user := range m.Users {
		users = append(users, user)
	}
	return users, nil
}

func (m *MemoryStorage) CreateUser(ctx context.Context, user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[user.ID]; exists {
		return ErrUserAlreadyExists
	}
	m.Users[user.ID] = user
	return nil
}

func (m *MemoryStorage) UpdateUser(ctx context.Context, user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[user.ID]; !exists {
		return ErrUserNotFound
	}
	m.Users[user.ID] = user
	return nil
}

func (m *MemoryStorage) DeleteUser(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[id]; !exists {
		return ErrUserNotFound
	}
	delete(m.Users, id)
	return nil
}

// ========== Barber Profile Operations ==========

func (m *MemoryStorage) GetBarberProfile(ctx context.Context, id uuid.UUID) (*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	profile, exists := m.BarberProfiles[id]
	if !exists {
		return nil, ErrBarberProfileNotFound
	}
	return profile, nil
}

func (m *MemoryStorage) GetBarberProfileByUserID(ctx context.Context, userID uuid.UUID) (*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, profile := range m.BarberProfiles {
		if profile.UserID == userID {
			return profile, nil
		}
	}
	return nil, ErrBarberProfileNotFound
}

func (m *MemoryStorage) GetBarberProfiles(ctx context.Context) ([]*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	profiles := make([]*models.BarberProfile, 0, len(m.BarberProfiles))
	for _, profile := range m.BarberProfiles {
		profiles = append(profiles, profile)
	}
	return profiles, nil
}

func (m *MemoryStorage) CreateBarberProfile(ctx context.Context, profile *models.BarberProfile) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[profile.ID]; exists {
		return ErrBarberProfileAlreadyExists
	}
	m.BarberProfiles[profile.ID] = profile
	return nil
}

func (m *MemoryStorage) UpdateBarberProfile(ctx context.Context, profile *models.BarberProfile) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[profile.ID]; !exists {
		return ErrBarberProfileNotFound
	}
	m.BarberProfiles[profile.ID] = profile
	return nil
}

func (m *MemoryStorage) DeleteBarberProfile(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[id]; !exists {
		return ErrBarberProfileNotFound
	}
	delete(m.BarberProfiles, id)
	return nil
}

// haversineDistance calculates the distance between two points in kilometers
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth's radius in kilometers
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func (m *MemoryStorage) SearchBarbers(ctx context.Context, lat, lng, radiusKm float64) ([]*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var profiles []*models.BarberProfile
	for _, profile := range m.BarberProfiles {
		if len(profile.Location.Coordinates) >= 2 {
			profileLng := profile.Location.Coordinates[0]
			profileLat := profile.Location.Coordinates[1]
			distance := haversineDistance(lat, lng, profileLat, profileLng)
			if distance <= radiusKm {
				profiles = append(profiles, profile)
			}
		}
	}
	return profiles, nil
}

// ========== Appointment Operations ==========

func (m *MemoryStorage) GetAppointment(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	appointment, exists := m.Appointments[id]
	if !exists {
		return nil, ErrAppointmentNotFound
	}
	return appointment, nil
}

func (m *MemoryStorage) GetAppointments(ctx context.Context) ([]*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	appointments := make([]*models.Appointment, 0, len(m.Appointments))
	for _, appointment := range m.Appointments {
		appointments = append(appointments, appointment)
	}
	return appointments, nil
}

func (m *MemoryStorage) GetUserAppointments(ctx context.Context, userID uuid.UUID) ([]*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var appointments []*models.Appointment
	for _, appointment := range m.Appointments {
		if appointment.ClientID == userID {
			appointments = append(appointments, appointment)
		}
	}
	return appointments, nil
}

func (m *MemoryStorage) GetBarberAppointments(ctx context.Context, barberID uuid.UUID) ([]*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var appointments []*models.Appointment
	for _, appointment := range m.Appointments {
		if appointment.BarberID == barberID {
			appointments = append(appointments, appointment)
		}
	}
	return appointments, nil
}

func (m *MemoryStorage) CreateAppointment(ctx context.Context, appointment *models.Appointment) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[appointment.ID]; exists {
		return ErrAppointmentAlreadyExists
	}
	m.Appointments[appointment.ID] = appointment
	return nil
}

func (m *MemoryStorage) UpdateAppointment(ctx context.Context, appointment *models.Appointment) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[appointment.ID]; !exists {
		return ErrAppointmentNotFound
	}
	m.Appointments[appointment.ID] = appointment
	return nil
}

func (m *MemoryStorage) DeleteAppointment(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[id]; !exists {
		return ErrAppointmentNotFound
	}
	delete(m.Appointments, id)
	return nil
}

// ========== Review Operations ==========

func (m *MemoryStorage) GetReview(ctx context.Context, id uuid.UUID) (*models.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	review, exists := m.Reviews[id]
	if !exists {
		return nil, ErrReviewNotFound
	}
	return review, nil
}

func (m *MemoryStorage) GetReviewByAppointmentID(ctx context.Context, appointmentID uuid.UUID) (*models.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, review := range m.Reviews {
		if review.AppointmentID == appointmentID {
			return review, nil
		}
	}
	return nil, ErrReviewNotFound
}

func (m *MemoryStorage) GetReviews(ctx context.Context) ([]*models.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	reviews := make([]*models.Review, 0, len(m.Reviews))
	for _, review := range m.Reviews {
		reviews = append(reviews, review)
	}
	return reviews, nil
}

func (m *MemoryStorage) GetBarberReviews(ctx context.Context, barberID uuid.UUID) ([]*models.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var reviews []*models.Review
	for _, review := range m.Reviews {
		if review.BarberID == barberID {
			reviews = append(reviews, review)
		}
	}
	return reviews, nil
}

func (m *MemoryStorage) GetClientReviews(ctx context.Context, clientID uuid.UUID) ([]*models.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var reviews []*models.Review
	for _, review := range m.Reviews {
		if review.ClientID == clientID {
			reviews = append(reviews, review)
		}
	}
	return reviews, nil
}

func (m *MemoryStorage) CreateReview(ctx context.Context, review *models.Review) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Reviews[review.ID]; exists {
		return ErrReviewAlreadyExists
	}
	m.Reviews[review.ID] = review
	return nil
}

func (m *MemoryStorage) UpdateReview(ctx context.Context, review *models.Review) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Reviews[review.ID]; !exists {
		return ErrReviewNotFound
	}
	m.Reviews[review.ID] = review
	return nil
}

func (m *MemoryStorage) DeleteReview(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Reviews[id]; !exists {
		return ErrReviewNotFound
	}
	delete(m.Reviews, id)
	return nil
}

// ========== Product Operations ==========

func (m *MemoryStorage) GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	product, exists := m.Products[id]
	if !exists {
		return nil, ErrProductNotFound
	}
	return product, nil
}

func (m *MemoryStorage) GetProducts(ctx context.Context) ([]*models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	products := make([]*models.Product, 0, len(m.Products))
	for _, product := range m.Products {
		products = append(products, product)
	}
	return products, nil
}

func (m *MemoryStorage) GetProductsByCategory(ctx context.Context, category string) ([]*models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var products []*models.Product
	for _, product := range m.Products {
		if product.Category == category {
			products = append(products, product)
		}
	}
	return products, nil
}

func (m *MemoryStorage) GetProductsByBarberID(ctx context.Context, barberID uuid.UUID) ([]*models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var products []*models.Product
	for _, product := range m.Products {
		if product.BarberID != nil && *product.BarberID == barberID {
			products = append(products, product)
		}
	}
	return products, nil
}

func (m *MemoryStorage) CreateProduct(ctx context.Context, product *models.Product) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Products[product.ID]; exists {
		return ErrProductAlreadyExists
	}
	m.Products[product.ID] = product
	return nil
}

func (m *MemoryStorage) UpdateProduct(ctx context.Context, product *models.Product) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Products[product.ID]; !exists {
		return ErrProductNotFound
	}
	m.Products[product.ID] = product
	return nil
}

func (m *MemoryStorage) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Products[id]; !exists {
		return ErrProductNotFound
	}
	delete(m.Products, id)
	return nil
}

// ========== Order Operations ==========

func (m *MemoryStorage) GetOrder(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	order, exists := m.Orders[id]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return order, nil
}

func (m *MemoryStorage) GetOrders(ctx context.Context) ([]*models.Order, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	orders := make([]*models.Order, 0, len(m.Orders))
	for _, order := range m.Orders {
		orders = append(orders, order)
	}
	return orders, nil
}

func (m *MemoryStorage) GetUserOrders(ctx context.Context, userID uuid.UUID) ([]*models.Order, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var orders []*models.Order
	for _, order := range m.Orders {
		if order.UserID == userID {
			orders = append(orders, order)
		}
	}
	return orders, nil
}

func (m *MemoryStorage) CreateOrder(ctx context.Context, order *models.Order) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Orders[order.ID]; exists {
		return ErrOrderAlreadyExists
	}
	m.Orders[order.ID] = order
	return nil
}

func (m *MemoryStorage) UpdateOrder(ctx context.Context, order *models.Order) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Orders[order.ID]; !exists {
		return ErrOrderNotFound
	}
	m.Orders[order.ID] = order
	return nil
}

func (m *MemoryStorage) DeleteOrder(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Orders[id]; !exists {
		return ErrOrderNotFound
	}
	delete(m.Orders, id)
	return nil
}

// ========== Coupon Operations ==========

func (m *MemoryStorage) GetCoupon(ctx context.Context, id uuid.UUID) (*models.Coupon, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	coupon, exists := m.Coupons[id]
	if !exists {
		return nil, ErrCouponNotFound
	}
	return coupon, nil
}

func (m *MemoryStorage) GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, coupon := range m.Coupons {
		if coupon.Code == code {
			return coupon, nil
		}
	}
	return nil, ErrCouponNotFound
}

func (m *MemoryStorage) GetCoupons(ctx context.Context) ([]*models.Coupon, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	coupons := make([]*models.Coupon, 0, len(m.Coupons))
	for _, coupon := range m.Coupons {
		coupons = append(coupons, coupon)
	}
	return coupons, nil
}

func (m *MemoryStorage) GetActiveCoupons(ctx context.Context) ([]*models.Coupon, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	now := time.Now()
	var coupons []*models.Coupon
	for _, coupon := range m.Coupons {
		if coupon.ValidFrom.Before(now) && coupon.ValidUntil.After(now) {
			if coupon.UsageLimit == nil || coupon.UsageCount < *coupon.UsageLimit {
				coupons = append(coupons, coupon)
			}
		}
	}
	return coupons, nil
}

func (m *MemoryStorage) CreateCoupon(ctx context.Context, coupon *models.Coupon) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Coupons[coupon.ID]; exists {
		return ErrCouponAlreadyExists
	}
	m.Coupons[coupon.ID] = coupon
	return nil
}

func (m *MemoryStorage) UpdateCoupon(ctx context.Context, coupon *models.Coupon) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Coupons[coupon.ID]; !exists {
		return ErrCouponNotFound
	}
	m.Coupons[coupon.ID] = coupon
	return nil
}

func (m *MemoryStorage) DeleteCoupon(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Coupons[id]; !exists {
		return ErrCouponNotFound
	}
	delete(m.Coupons, id)
	return nil
}

// ========== Chat Message Operations ==========

func (m *MemoryStorage) GetChatMessage(ctx context.Context, id uuid.UUID) (*models.ChatMessage, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	message, exists := m.ChatMessages[id]
	if !exists {
		return nil, ErrChatMessageNotFound
	}
	return message, nil
}

func (m *MemoryStorage) GetChatMessages(ctx context.Context) ([]*models.ChatMessage, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	messages := make([]*models.ChatMessage, 0, len(m.ChatMessages))
	for _, message := range m.ChatMessages {
		messages = append(messages, message)
	}
	return messages, nil
}

func (m *MemoryStorage) GetChatMessagesByAppointmentID(ctx context.Context, appointmentID uuid.UUID) ([]*models.ChatMessage, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var messages []*models.ChatMessage
	for _, message := range m.ChatMessages {
		if message.AppointmentID == appointmentID {
			messages = append(messages, message)
		}
	}
	return messages, nil
}

func (m *MemoryStorage) GetChatThreads(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Get unique appointment IDs involving this user
	appointmentSet := make(map[uuid.UUID]struct{})
	for _, message := range m.ChatMessages {
		if message.SenderID == userID || message.ReceiverID == userID {
			appointmentSet[message.AppointmentID] = struct{}{}
		}
	}

	threads := make([]uuid.UUID, 0, len(appointmentSet))
	for appointmentID := range appointmentSet {
		threads = append(threads, appointmentID)
	}
	return threads, nil
}

func (m *MemoryStorage) GetUnreadMessageCount(ctx context.Context, userID uuid.UUID) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	count := 0
	for _, message := range m.ChatMessages {
		if message.ReceiverID == userID && message.ReadAt == nil {
			count++
		}
	}
	return count, nil
}

func (m *MemoryStorage) CreateChatMessage(ctx context.Context, message *models.ChatMessage) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.ChatMessages[message.ID]; exists {
		return ErrChatMessageAlreadyExists
	}
	m.ChatMessages[message.ID] = message
	return nil
}

func (m *MemoryStorage) UpdateChatMessage(ctx context.Context, message *models.ChatMessage) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.ChatMessages[message.ID]; !exists {
		return ErrChatMessageNotFound
	}
	m.ChatMessages[message.ID] = message
	return nil
}

func (m *MemoryStorage) MarkMessagesAsRead(ctx context.Context, userID, appointmentID uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for _, message := range m.ChatMessages {
		if message.AppointmentID == appointmentID && message.ReceiverID == userID && message.ReadAt == nil {
			message.ReadAt = &now
		}
	}
	return nil
}

func (m *MemoryStorage) DeleteChatMessage(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.ChatMessages[id]; !exists {
		return ErrChatMessageNotFound
	}
	delete(m.ChatMessages, id)
	return nil
}

// ========== Notification Operations ==========

func (m *MemoryStorage) GetNotification(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	notification, exists := m.Notifications[id]
	if !exists {
		return nil, ErrNotificationNotFound
	}
	return notification, nil
}

func (m *MemoryStorage) GetNotifications(ctx context.Context) ([]*models.Notification, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	notifications := make([]*models.Notification, 0, len(m.Notifications))
	for _, notification := range m.Notifications {
		notifications = append(notifications, notification)
	}
	return notifications, nil
}

func (m *MemoryStorage) GetUserNotifications(ctx context.Context, userID uuid.UUID) ([]*models.Notification, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var notifications []*models.Notification
	for _, notification := range m.Notifications {
		if notification.UserID == userID {
			notifications = append(notifications, notification)
		}
	}
	return notifications, nil
}

func (m *MemoryStorage) GetUnreadNotificationCount(ctx context.Context, userID uuid.UUID) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	count := 0
	for _, notification := range m.Notifications {
		if notification.UserID == userID && !notification.IsRead {
			count++
		}
	}
	return count, nil
}

func (m *MemoryStorage) CreateNotification(ctx context.Context, notification *models.Notification) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Notifications[notification.ID]; exists {
		return ErrNotificationAlreadyExists
	}
	m.Notifications[notification.ID] = notification
	return nil
}

func (m *MemoryStorage) UpdateNotification(ctx context.Context, notification *models.Notification) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Notifications[notification.ID]; !exists {
		return ErrNotificationNotFound
	}
	m.Notifications[notification.ID] = notification
	return nil
}

func (m *MemoryStorage) MarkNotificationAsRead(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	notification, exists := m.Notifications[id]
	if !exists {
		return ErrNotificationNotFound
	}
	notification.IsRead = true
	return nil
}

func (m *MemoryStorage) MarkAllNotificationsAsRead(ctx context.Context, userID uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, notification := range m.Notifications {
		if notification.UserID == userID {
			notification.IsRead = true
		}
	}
	return nil
}

func (m *MemoryStorage) DeleteNotification(ctx context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Notifications[id]; !exists {
		return ErrNotificationNotFound
	}
	delete(m.Notifications, id)
	return nil
}

// ========== Utility Methods ==========

func (m *MemoryStorage) Ping(ctx context.Context) error {
	return nil // Memory storage is always available
}

func (m *MemoryStorage) Close() error {
	return nil // Nothing to close for memory storage
}

// ========== Seed Mock Data ==========

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
	bio := "Professional barber with 10+ years of experience in modern cuts and classic styles."
	address := "123 Main St, Brooklyn, NY 11201"
	m.BarberProfiles[barberID] = &models.BarberProfile{
		ID:               barberID,
		UserID:           barberID,
		BusinessName:     &businessName,
		Bio:              &bio,
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
		Location: models.Location{
			Type:        "Point",
			Coordinates: []float64{-73.935242, 40.730610},
		},
		Address:   &address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
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
