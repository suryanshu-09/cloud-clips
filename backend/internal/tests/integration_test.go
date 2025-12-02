package tests

import (
	"context"
	"testing"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIntegration_UserWorkflow(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	// Create a user
	user := &models.User{
		ID:                uuid.New(),
		Email:             "integration@example.com",
		Name:              "Integration User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	// Test: Create user
	err := store.CreateUser(ctx, user)
	assert.NoError(t, err)

	// Test: Get user
	retrievedUser, err := store.GetUser(ctx, user.ID)
	assert.NoError(t, err)
	assert.Equal(t, user.Email, retrievedUser.Email)
	assert.Equal(t, user.Name, retrievedUser.Name)

	// Test: Update user
	user.Name = "Updated Integration User"
	err = store.UpdateUser(ctx, user)
	assert.NoError(t, err)

	updatedUser, err := store.GetUser(ctx, user.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Updated Integration User", updatedUser.Name)

	// Test: Get all users
	allUsers, err := store.GetUsers(ctx)
	assert.NoError(t, err)
	assert.Len(t, allUsers, 1)

	// Test: Delete user
	err = store.DeleteUser(ctx, user.ID)
	assert.NoError(t, err)

	_, err = store.GetUser(ctx, user.ID)
	assert.Error(t, err)
	assert.Equal(t, storage.ErrUserNotFound, err)
}

func TestIntegration_BarberWorkflow(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	// Create a barber user
	barberUser := &models.User{
		ID:                uuid.New(),
		Email:             "barber@example.com",
		Name:              "Professional Barber",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err := store.CreateUser(ctx, barberUser)
	require.NoError(t, err)

	// Create barber profile
	businessName := "Elite Cuts"
	bio := "10+ years of experience in modern cuts"
	address := "123 Main St, NYC, NY 10001"
	barberProfile := &models.BarberProfile{
		ID:               barberUser.ID,
		UserID:           barberUser.ID,
		BusinessName:     &businessName,
		Bio:              &bio,
		Specialties:      []string{"Fade", "Beard Trim", "Classic Cut"},
		Experience:       10,
		ServiceLocations: []models.ServiceLocation{models.ServiceLocationInSalon, models.ServiceLocationInHome},
		WorkingHours: map[string]models.WorkingHour{
			"monday":  {Start: "09:00", End: "18:00", IsAvailable: true},
			"tuesday": {Start: "09:00", End: "18:00", IsAvailable: true},
		},
		Services: []models.Service{
			{Name: "Basic Cut", Price: 25.00, Duration: 30, Description: stringPtr("Simple haircut")},
			{Name: "Fade", Price: 35.00, Duration: 45, Description: stringPtr("Professional fade")},
		},
		Gallery: []models.GalleryItem{
			{URL: "https://example.com/gallery1.jpg", Type: "after"},
		},
		Rating:       4.8,
		TotalReviews: 127,
		IsVerified:   true,
		Location: models.Location{
			Type:        "Point",
			Coordinates: []float64{-74.0060, 40.7128}, // GeoJSON: [lng, lat]
		},
		Address:   &address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test: Create barber profile
	err = store.CreateBarberProfile(ctx, barberProfile)
	assert.NoError(t, err)

	// Test: Get barber profile
	retrievedProfile, err := store.GetBarberProfile(ctx, barberProfile.ID)
	assert.NoError(t, err)
	assert.Equal(t, *barberProfile.BusinessName, *retrievedProfile.BusinessName)
	assert.Equal(t, *barberProfile.Bio, *retrievedProfile.Bio)

	// Test: Search barbers
	barbers, err := store.SearchBarbers(ctx, 40.7128, -74.0060, 10.0)
	assert.NoError(t, err)
	assert.Len(t, barbers, 1)
	assert.Equal(t, barberProfile.ID, barbers[0].ID)

	// Test: Get all barber profiles
	allProfiles, err := store.GetBarberProfiles(ctx)
	assert.NoError(t, err)
	assert.Len(t, allProfiles, 1)
}

func TestIntegration_AppointmentWorkflow(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	// Create client user
	clientUser := &models.User{
		ID:                uuid.New(),
		Email:             "client@example.com",
		Name:              "Client User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err := store.CreateUser(ctx, clientUser)
	require.NoError(t, err)

	// Create barber user
	barberUser := &models.User{
		ID:                uuid.New(),
		Email:             "barber@example.com",
		Name:              "Barber User",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err = store.CreateUser(ctx, barberUser)
	require.NoError(t, err)

	// Create barber profile
	bio := "Professional barber"
	barberProfile := &models.BarberProfile{
		ID:        barberUser.ID,
		UserID:    barberUser.ID,
		Bio:       &bio,
		Rating:    4.5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = store.CreateBarberProfile(ctx, barberProfile)
	require.NoError(t, err)

	// Create appointment
	appointment := &models.Appointment{
		ID:              uuid.New(),
		ClientID:        clientUser.ID,
		BarberID:        barberUser.ID,
		Status:          models.AppointmentStatusPending,
		ServiceType:     "Fade",
		HairType:        models.HairTypeStraight,
		SpecialRequests: stringPtr("Make it a low fade"),
		Location: models.AppointmentLocation{
			Type:        models.LocationTypeInSalon,
			Address:     stringPtr("123 Main St, NYC, NY 10001"),
			Coordinates: []float64{40.7128, -74.0060},
		},
		ScheduledFor:  time.Now().Add(24 * time.Hour),
		Duration:      45,
		Price:         35.00,
		PaymentStatus: models.PaymentStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Test: Create appointment
	err = store.CreateAppointment(ctx, appointment)
	assert.NoError(t, err)

	// Test: Get appointment
	retrievedAppointment, err := store.GetAppointment(ctx, appointment.ID)
	assert.NoError(t, err)
	assert.Equal(t, appointment.ClientID, retrievedAppointment.ClientID)
	assert.Equal(t, appointment.BarberID, retrievedAppointment.BarberID)
	assert.Equal(t, appointment.ServiceType, retrievedAppointment.ServiceType)

	// Test: Get user appointments
	userAppointments, err := store.GetUserAppointments(ctx, clientUser.ID)
	assert.NoError(t, err)
	assert.Len(t, userAppointments, 1)
	assert.Equal(t, appointment.ID, userAppointments[0].ID)

	// Test: Get barber appointments
	barberAppointments, err := store.GetBarberAppointments(ctx, barberUser.ID)
	assert.NoError(t, err)
	assert.Len(t, barberAppointments, 1)
	assert.Equal(t, appointment.ID, barberAppointments[0].ID)

	// Test: Update appointment status
	appointment.Status = models.AppointmentStatusConfirmed
	err = store.UpdateAppointment(ctx, appointment)
	assert.NoError(t, err)

	updatedAppointment, err := store.GetAppointment(ctx, appointment.ID)
	assert.NoError(t, err)
	assert.Equal(t, models.AppointmentStatusConfirmed, updatedAppointment.Status)

	// Test: Get all appointments
	allAppointments, err := store.GetAppointments(ctx)
	assert.NoError(t, err)
	assert.Len(t, allAppointments, 1)
}

func TestIntegration_ComplexWorkflow(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	// Create multiple users
	client1 := &models.User{
		ID:                uuid.New(),
		Email:             "client1@example.com",
		Name:              "Client One",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	client2 := &models.User{
		ID:                uuid.New(),
		Email:             "client2@example.com",
		Name:              "Client Two",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7130, -74.0062}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: false},
		AuthProvider:      models.AuthProviderGoogle,
	}

	barber1 := &models.User{
		ID:                uuid.New(),
		Email:             "barber1@example.com",
		Name:              "Barber One",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7128, -74.0060}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	barber2 := &models.User{
		ID:                uuid.New(),
		Email:             "barber2@example.com",
		Name:              "Barber Two",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{40.7130, -74.0062}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: false, SMS: true, Email: true},
		AuthProvider:      models.AuthProviderApple,
	}

	// Create users
	err := store.CreateUser(ctx, client1)
	require.NoError(t, err)
	err = store.CreateUser(ctx, client2)
	require.NoError(t, err)
	err = store.CreateUser(ctx, barber1)
	require.NoError(t, err)
	err = store.CreateUser(ctx, barber2)
	require.NoError(t, err)

	// Create barber profiles
	businessName1 := "Elite Cuts"
	bio1 := "Expert in modern styles"
	barberProfile1 := &models.BarberProfile{
		ID:           barber1.ID,
		UserID:       barber1.ID,
		BusinessName: &businessName1,
		Bio:          &bio1,
		Rating:       4.8,
		TotalReviews: 150,
		IsVerified:   true,
		Location:     models.Location{Type: "Point", Coordinates: []float64{-74.0060, 40.7128}}, // GeoJSON: [lng, lat]
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	businessName2 := "Classic Barber"
	bio2 := "Traditional barber with 20 years experience"
	barberProfile2 := &models.BarberProfile{
		ID:           barber2.ID,
		UserID:       barber2.ID,
		BusinessName: &businessName2,
		Bio:          &bio2,
		Rating:       4.6,
		TotalReviews: 200,
		IsVerified:   true,
		Location:     models.Location{Type: "Point", Coordinates: []float64{-74.0062, 40.7130}}, // GeoJSON: [lng, lat]
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err = store.CreateBarberProfile(ctx, barberProfile1)
	require.NoError(t, err)
	err = store.CreateBarberProfile(ctx, barberProfile2)
	require.NoError(t, err)

	// Create appointments for different clients
	appointment1 := &models.Appointment{
		ID:            uuid.New(),
		ClientID:      client1.ID,
		BarberID:      barber1.ID,
		Status:        models.AppointmentStatusConfirmed,
		ServiceType:   "Fade",
		HairType:      models.HairTypeStraight,
		ScheduledFor:  time.Now().Add(24 * time.Hour),
		Duration:      45,
		Price:         35.00,
		PaymentStatus: models.PaymentStatusCompleted,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	appointment2 := &models.Appointment{
		ID:            uuid.New(),
		ClientID:      client2.ID,
		BarberID:      barber2.ID,
		Status:        models.AppointmentStatusPending,
		ServiceType:   "Classic Cut",
		HairType:      models.HairTypeCurly,
		ScheduledFor:  time.Now().Add(48 * time.Hour),
		Duration:      30,
		Price:         25.00,
		PaymentStatus: models.PaymentStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	err = store.CreateAppointment(ctx, appointment1)
	require.NoError(t, err)
	err = store.CreateAppointment(ctx, appointment2)
	require.NoError(t, err)

	// Test: Verify all data is correctly stored
	allUsers, err := store.GetUsers(ctx)
	assert.NoError(t, err)
	assert.Len(t, allUsers, 4)

	allBarbers, err := store.GetBarberProfiles(ctx)
	assert.NoError(t, err)
	assert.Len(t, allBarbers, 2)

	allAppointments, err := store.GetAppointments(ctx)
	assert.NoError(t, err)
	assert.Len(t, allAppointments, 2)

	// Test: Search barbers in specific area
	nycBarbers, err := store.SearchBarbers(ctx, 40.7128, -74.0060, 5.0)
	assert.NoError(t, err)
	assert.Len(t, nycBarbers, 2) // Both barbers should be in range

	// Test: Get appointments for specific users
	client1Appointments, err := store.GetUserAppointments(ctx, client1.ID)
	assert.NoError(t, err)
	assert.Len(t, client1Appointments, 1)
	assert.Equal(t, appointment1.ID, client1Appointments[0].ID)

	barber1Appointments, err := store.GetBarberAppointments(ctx, barber1.ID)
	assert.NoError(t, err)
	assert.Len(t, barber1Appointments, 1)
	assert.Equal(t, appointment1.ID, barber1Appointments[0].ID)

	// Test: Verify relationships
	barber1Profile, err := store.GetBarberProfile(ctx, barber1.ID)
	assert.NoError(t, err)
	assert.Equal(t, barber1.ID, barber1Profile.UserID)

	appointment1Data, err := store.GetAppointment(ctx, appointment1.ID)
	assert.NoError(t, err)
	assert.Equal(t, client1.ID, appointment1Data.ClientID)
	assert.Equal(t, barber1.ID, appointment1Data.BarberID)
}

func stringPtr(s string) *string {
	return &s
}
