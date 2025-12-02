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

	// Review errors
	ErrReviewNotFound      = errors.New("review not found")
	ErrReviewAlreadyExists = errors.New("review already exists")

	// Product errors
	ErrProductNotFound      = errors.New("product not found")
	ErrProductAlreadyExists = errors.New("product already exists")

	// Order errors
	ErrOrderNotFound      = errors.New("order not found")
	ErrOrderAlreadyExists = errors.New("order already exists")

	// Coupon errors
	ErrCouponNotFound      = errors.New("coupon not found")
	ErrCouponAlreadyExists = errors.New("coupon already exists")
	ErrCouponInvalid       = errors.New("coupon is invalid or expired")

	// Chat message errors
	ErrChatMessageNotFound      = errors.New("chat message not found")
	ErrChatMessageAlreadyExists = errors.New("chat message already exists")

	// Notification errors
	ErrNotificationNotFound      = errors.New("notification not found")
	ErrNotificationAlreadyExists = errors.New("notification already exists")

	// Database errors
	ErrDatabaseConnection  = errors.New("database connection failed")
	ErrDatabaseQuery       = errors.New("database query failed")
	ErrDatabaseTransaction = errors.New("database transaction failed")
)
