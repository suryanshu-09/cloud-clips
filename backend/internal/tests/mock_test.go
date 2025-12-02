package tests

import (
	"testing"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestMockStorage_GetUser(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)

	userID := uuid.New()
	expectedUser := &models.User{
		ID:    userID,
		Email: "test@example.com",
		Name:  "Test User",
		Role:  models.RoleClient,
	}

	// Set up mock expectation
	mockStorage.EXPECT().
		GetUser(userID).
		Return(expectedUser, nil).
		Times(1)

	// Test
	user, err := mockStorage.GetUser(userID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedUser, user)
}

func TestMockStorage_GetUser_Error(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)

	userID := uuid.New()

	// Set up mock expectation for error
	mockStorage.EXPECT().
		GetUser(userID).
		Return(nil, storage.ErrUserNotFound).
		Times(1)

	// Test
	user, err := mockStorage.GetUser(userID)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Equal(t, storage.ErrUserNotFound, err)
}

func TestMockStorage_CreateUser(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)

	user := &models.User{
		ID:    uuid.New(),
		Email: "new@example.com",
		Name:  "New User",
		Role:  models.RoleClient,
	}

	// Set up mock expectation
	mockStorage.EXPECT().
		CreateUser(user).
		Return(nil).
		Times(1)

	// Test
	err := mockStorage.CreateUser(user)

	// Assert
	assert.NoError(t, err)
}

func TestMockStorage_GetBarberProfiles(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)

	barberID := uuid.New()
	bio := "Professional barber"
	expectedProfiles := []*models.BarberProfile{
		{
			ID:         barberID,
			UserID:     barberID,
			Bio:        &bio,
			Rating:     4.5,
			IsVerified: true,
		},
	}

	// Set up mock expectation
	mockStorage.EXPECT().
		GetBarberProfiles().
		Return(expectedProfiles, nil).
		Times(1)

	// Test
	profiles, err := mockStorage.GetBarberProfiles()

	// Assert
	assert.NoError(t, err)
	assert.Len(t, profiles, 1)
	assert.Equal(t, expectedProfiles[0].ID, profiles[0].ID)
	assert.Equal(t, expectedProfiles[0].Bio, profiles[0].Bio)
}

func TestMockStorage_SearchBarbers(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)

	lat, lng, radius := 40.7128, -74.0060, 10.0
	nycBio := "Barber in NYC"
	expectedProfiles := []*models.BarberProfile{
		{
			ID:     uuid.New(),
			Bio:    &nycBio,
			Rating: 4.8,
		},
	}

	// Set up mock expectation
	mockStorage.EXPECT().
		SearchBarbers(lat, lng, radius).
		Return(expectedProfiles, nil).
		Times(1)

	// Test
	profiles, err := mockStorage.SearchBarbers(lat, lng, radius)

	// Assert
	assert.NoError(t, err)
	assert.Len(t, profiles, 1)
}

func TestMockAuthService_GenerateToken(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockAuth := NewMockAuthServiceInterface(ctrl)

	userID := uuid.New()
	expectedToken := "jwt-token-123"

	// Set up mock expectation
	mockAuth.EXPECT().
		GenerateToken(userID).
		Return(expectedToken, nil).
		Times(1)

	// Test
	token, err := mockAuth.GenerateToken(userID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedToken, token)
}

func TestMockAuthService_ValidateToken(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockAuth := NewMockAuthServiceInterface(ctrl)

	token := "jwt-token-123"
	expectedUserID := uuid.New()

	// Set up mock expectation
	mockAuth.EXPECT().
		ValidateToken(token).
		Return(expectedUserID, nil).
		Times(1)

	// Test
	userID, err := mockAuth.ValidateToken(token)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedUserID, userID)
}

func TestMockNotificationService_SendPushNotification(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockNotification := NewMockNotificationServiceInterface(ctrl)

	userID := uuid.New()
	title := "Appointment Reminder"
	body := "Your appointment is tomorrow"

	// Set up mock expectation
	mockNotification.EXPECT().
		SendPushNotification(userID, title, body).
		Return(nil).
		Times(1)

	// Test
	err := mockNotification.SendPushNotification(userID, title, body)

	// Assert
	assert.NoError(t, err)
}

func TestMockPaymentService_CreatePaymentIntent(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockPayment := NewMockPaymentServiceInterface(ctrl)

	amount := 50.0
	currency := "USD"
	expectedIntentID := "pi_1234567890"

	// Set up mock expectation
	mockPayment.EXPECT().
		CreatePaymentIntent(amount, currency).
		Return(expectedIntentID, nil).
		Times(1)

	// Test
	intentID, err := mockPayment.CreatePaymentIntent(amount, currency)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedIntentID, intentID)
}

func TestComplexWorkflow_WithMocks(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockStorage := NewMockStorageInterface(ctrl)
	mockAuth := NewMockAuthServiceInterface(ctrl)
	mockNotification := NewMockNotificationServiceInterface(ctrl)
	mockPayment := NewMockPaymentServiceInterface(ctrl)

	userID := uuid.New()
	barberID := uuid.New()
	appointmentID := uuid.New()
	token := "jwt-token-123"
	paymentIntentID := "pi_1234567890"

	// Mock user lookup
	user := &models.User{
		ID:    userID,
		Email: "client@example.com",
		Name:  "Client User",
		Role:  models.RoleClient,
	}
	mockStorage.EXPECT().GetUser(userID).Return(user, nil).Times(1)

	// Mock token validation
	mockAuth.EXPECT().ValidateToken(token).Return(userID, nil).Times(1)

	// Mock barber profiles search
	expertBio := "Expert Barber"
	barbers := []*models.BarberProfile{
		{
			ID:     barberID,
			UserID: barberID,
			Bio:    &expertBio,
			Rating: 4.9,
		},
	}
	mockStorage.EXPECT().SearchBarbers(gomock.Any(), gomock.Any(), gomock.Any()).Return(barbers, nil).Times(1)

	// Mock appointment creation
	appointment := &models.Appointment{
		ID:       appointmentID,
		ClientID: userID,
		BarberID: barberID,
		Status:   models.AppointmentStatusPending,
		Price:    50.0,
	}
	mockStorage.EXPECT().CreateAppointment(gomock.Any()).Return(nil).Times(1)

	// Mock payment intent creation
	mockPayment.EXPECT().CreatePaymentIntent(50.0, "USD").Return(paymentIntentID, nil).Times(1)

	// Mock notification sending
	mockNotification.EXPECT().SendPushNotification(userID, gomock.Any(), gomock.Any()).Return(nil).Times(1)
	mockNotification.EXPECT().SendPushNotification(barberID, gomock.Any(), gomock.Any()).Return(nil).Times(1)

	// Test workflow
	// 1. Validate token
	validatedUserID, err := mockAuth.ValidateToken(token)
	require.NoError(t, err)
	assert.Equal(t, userID, validatedUserID)

	// 2. Get user
	retrievedUser, err := mockStorage.GetUser(userID)
	require.NoError(t, err)
	assert.Equal(t, user, retrievedUser)

	// 3. Search barbers
	foundBarbers, err := mockStorage.SearchBarbers(40.7128, -74.0060, 10.0)
	require.NoError(t, err)
	assert.Len(t, foundBarbers, 1)

	// 4. Create appointment
	err = mockStorage.CreateAppointment(appointment)
	require.NoError(t, err)

	// 5. Create payment intent
	intentID, err := mockPayment.CreatePaymentIntent(50.0, "USD")
	require.NoError(t, err)
	assert.Equal(t, paymentIntentID, intentID)

	// 6. Send notifications
	err = mockNotification.SendPushNotification(userID, "Appointment Booked", "Your appointment has been booked")
	require.NoError(t, err)

	err = mockNotification.SendPushNotification(barberID, "New Appointment", "You have a new appointment request")
	require.NoError(t, err)
}
