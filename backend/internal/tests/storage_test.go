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

func TestMemoryStorage_GetUser(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	userID := uuid.New()
	testUser := &models.User{
		ID:                userID,
		Email:             "test@example.com",
		Name:              "Test User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err := store.CreateUser(ctx, testUser)
	require.NoError(t, err)

	// Test
	retrievedUser, err := store.GetUser(ctx, userID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, retrievedUser)
	assert.Equal(t, testUser.ID, retrievedUser.ID)
	assert.Equal(t, testUser.Email, retrievedUser.Email)
	assert.Equal(t, testUser.Name, retrievedUser.Name)
	assert.Equal(t, testUser.Role, retrievedUser.Role)
}

func TestMemoryStorage_GetUser_NotFound(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()
	nonExistentID := uuid.New()

	// Test
	user, err := store.GetUser(ctx, nonExistentID)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Equal(t, storage.ErrUserNotFound, err)
}

func TestMemoryStorage_GetUsers(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	user1 := &models.User{
		ID:                uuid.New(),
		Email:             "user1@example.com",
		Name:              "User 1",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	user2 := &models.User{
		ID:                uuid.New(),
		Email:             "user2@example.com",
		Name:              "User 2",
		Role:              models.RoleBarber,
		Location:          models.Location{Type: "Point", Coordinates: []float64{1, 1}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: false, SMS: true, Email: false},
		AuthProvider:      models.AuthProviderGoogle,
	}

	err := store.CreateUser(ctx, user1)
	require.NoError(t, err)
	err = store.CreateUser(ctx, user2)
	require.NoError(t, err)

	// Test
	users, err := store.GetUsers(ctx)

	// Assert
	assert.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestMemoryStorage_CreateUser(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	user := &models.User{
		ID:                uuid.New(),
		Email:             "newuser@example.com",
		Name:              "New User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	// Test
	err := store.CreateUser(ctx, user)

	// Assert
	assert.NoError(t, err)

	// Verify user was created
	retrievedUser, err := store.GetUser(ctx, user.ID)
	assert.NoError(t, err)
	assert.Equal(t, user.Email, retrievedUser.Email)
}

func TestMemoryStorage_CreateUser_Duplicate(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	userID := uuid.New()
	user := &models.User{
		ID:                userID,
		Email:             "duplicate@example.com",
		Name:              "Duplicate User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	// Create first user
	err := store.CreateUser(ctx, user)
	require.NoError(t, err)

	// Test - try to create duplicate
	err = store.CreateUser(ctx, user)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, storage.ErrUserAlreadyExists, err)
}

func TestMemoryStorage_UpdateUser(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	user := &models.User{
		ID:                uuid.New(),
		Email:             "update@example.com",
		Name:              "Original Name",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err := store.CreateUser(ctx, user)
	require.NoError(t, err)

	// Update user
	user.Name = "Updated Name"
	user.Email = "updated@example.com"

	// Test
	err = store.UpdateUser(ctx, user)

	// Assert
	assert.NoError(t, err)

	// Verify update
	retrievedUser, err := store.GetUser(ctx, user.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Updated Name", retrievedUser.Name)
	assert.Equal(t, "updated@example.com", retrievedUser.Email)
}

func TestMemoryStorage_UpdateUser_NotFound(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	user := &models.User{
		ID:                uuid.New(),
		Email:             "notfound@example.com",
		Name:              "Not Found User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	// Test - try to update non-existent user
	err := store.UpdateUser(ctx, user)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, storage.ErrUserNotFound, err)
}

func TestMemoryStorage_DeleteUser(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()

	user := &models.User{
		ID:                uuid.New(),
		Email:             "delete@example.com",
		Name:              "Delete User",
		Role:              models.RoleClient,
		Location:          models.Location{Type: "Point", Coordinates: []float64{0, 0}},
		CreatedAt:         time.Now(),
		LastActive:        time.Now(),
		NotificationPrefs: models.NotificationPrefs{Push: true, SMS: false, Email: true},
		AuthProvider:      models.AuthProviderEmail,
	}

	err := store.CreateUser(ctx, user)
	require.NoError(t, err)

	// Test
	err = store.DeleteUser(ctx, user.ID)

	// Assert
	assert.NoError(t, err)

	// Verify deletion
	_, err = store.GetUser(ctx, user.ID)
	assert.Error(t, err)
	assert.Equal(t, storage.ErrUserNotFound, err)
}

func TestMemoryStorage_DeleteUser_NotFound(t *testing.T) {
	// Setup
	ctx := context.Background()
	store := storage.NewMemoryStorage()
	nonExistentID := uuid.New()

	// Test
	err := store.DeleteUser(ctx, nonExistentID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, storage.ErrUserNotFound, err)
}
