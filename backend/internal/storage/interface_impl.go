package storage

import (
	"cloud-clips/internal/interfaces"
	"cloud-clips/internal/models"
	"github.com/google/uuid"
)

// Ensure MemoryStorage implements StorageInterface
var _ interfaces.StorageInterface = (*MemoryStorage)(nil)

// GetUser retrieves a user by ID
func (m *MemoryStorage) GetUser(id uuid.UUID) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, exists := m.Users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// GetUsers retrieves all users
func (m *MemoryStorage) GetUsers() ([]*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	users := make([]*models.User, 0, len(m.Users))
	for _, user := range m.Users {
		users = append(users, user)
	}
	return users, nil
}

// CreateUser creates a new user
func (m *MemoryStorage) CreateUser(user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[user.ID]; exists {
		return ErrUserAlreadyExists
	}
	m.Users[user.ID] = user
	return nil
}

// UpdateUser updates an existing user
func (m *MemoryStorage) UpdateUser(user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[user.ID]; !exists {
		return ErrUserNotFound
	}
	m.Users[user.ID] = user
	return nil
}

// DeleteUser deletes a user by ID
func (m *MemoryStorage) DeleteUser(id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Users[id]; !exists {
		return ErrUserNotFound
	}
	delete(m.Users, id)
	return nil
}

// GetBarberProfile retrieves a barber profile by ID
func (m *MemoryStorage) GetBarberProfile(id uuid.UUID) (*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	profile, exists := m.BarberProfiles[id]
	if !exists {
		return nil, ErrBarberProfileNotFound
	}
	return profile, nil
}

// GetBarberProfiles retrieves all barber profiles
func (m *MemoryStorage) GetBarberProfiles() ([]*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	profiles := make([]*models.BarberProfile, 0, len(m.BarberProfiles))
	for _, profile := range m.BarberProfiles {
		profiles = append(profiles, profile)
	}
	return profiles, nil
}

// CreateBarberProfile creates a new barber profile
func (m *MemoryStorage) CreateBarberProfile(profile *models.BarberProfile) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[profile.ID]; exists {
		return ErrBarberProfileAlreadyExists
	}
	m.BarberProfiles[profile.ID] = profile
	return nil
}

// UpdateBarberProfile updates an existing barber profile
func (m *MemoryStorage) UpdateBarberProfile(profile *models.BarberProfile) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[profile.ID]; !exists {
		return ErrBarberProfileNotFound
	}
	m.BarberProfiles[profile.ID] = profile
	return nil
}

// DeleteBarberProfile deletes a barber profile by ID
func (m *MemoryStorage) DeleteBarberProfile(id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.BarberProfiles[id]; !exists {
		return ErrBarberProfileNotFound
	}
	delete(m.BarberProfiles, id)
	return nil
}

// GetAppointment retrieves an appointment by ID
func (m *MemoryStorage) GetAppointment(id uuid.UUID) (*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	appointment, exists := m.Appointments[id]
	if !exists {
		return nil, ErrAppointmentNotFound
	}
	return appointment, nil
}

// GetAppointments retrieves all appointments
func (m *MemoryStorage) GetAppointments() ([]*models.Appointment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	appointments := make([]*models.Appointment, 0, len(m.Appointments))
	for _, appointment := range m.Appointments {
		appointments = append(appointments, appointment)
	}
	return appointments, nil
}

// CreateAppointment creates a new appointment
func (m *MemoryStorage) CreateAppointment(appointment *models.Appointment) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[appointment.ID]; exists {
		return ErrAppointmentAlreadyExists
	}
	m.Appointments[appointment.ID] = appointment
	return nil
}

// UpdateAppointment updates an existing appointment
func (m *MemoryStorage) UpdateAppointment(appointment *models.Appointment) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[appointment.ID]; !exists {
		return ErrAppointmentNotFound
	}
	m.Appointments[appointment.ID] = appointment
	return nil
}

// DeleteAppointment deletes an appointment by ID
func (m *MemoryStorage) DeleteAppointment(id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.Appointments[id]; !exists {
		return ErrAppointmentNotFound
	}
	delete(m.Appointments, id)
	return nil
}

// SearchBarbers searches for barbers by location
func (m *MemoryStorage) SearchBarbers(lat, lng, radius float64) ([]*models.BarberProfile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Simple mock implementation - return all barber profiles
	// In real implementation, this would use geospatial queries
	var profiles []*models.BarberProfile
	for _, profile := range m.BarberProfiles {
		if user, exists := m.Users[profile.UserID]; exists && user.Role == models.RoleBarber {
			profiles = append(profiles, profile)
		}
	}
	return profiles, nil
}

// GetUserAppointments retrieves appointments for a specific user
func (m *MemoryStorage) GetUserAppointments(userID uuid.UUID) ([]*models.Appointment, error) {
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

// GetBarberAppointments retrieves appointments for a specific barber
func (m *MemoryStorage) GetBarberAppointments(barberID uuid.UUID) ([]*models.Appointment, error) {
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
