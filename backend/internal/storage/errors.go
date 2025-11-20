package storage

import "errors"

var (
	// User errors
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")

	// Barber profile errors
	ErrBarberProfileNotFound      = errors.New("barber profile not found")
	ErrBarberProfileAlreadyExists = errors.New("barber profile already exists")

	// Appointment errors
	ErrAppointmentNotFound      = errors.New("appointment not found")
	ErrAppointmentAlreadyExists = errors.New("appointment already exists")
)
