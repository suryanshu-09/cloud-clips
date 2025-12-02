package models

import (
	"time"

	"github.com/google/uuid"
)

type AppointmentStatus string

const (
	AppointmentStatusPending   AppointmentStatus = "pending"
	AppointmentStatusConfirmed AppointmentStatus = "confirmed"
	AppointmentStatusCompleted AppointmentStatus = "completed"
	AppointmentStatusCancelled AppointmentStatus = "cancelled"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
	PaymentStatusFailed    PaymentStatus = "failed"
)

type HairType string

const (
	HairTypeCurly    HairType = "curly"
	HairTypeStraight HairType = "straight"
	HairTypeWavy     HairType = "wavy"
)

type AppointmentLocationType string

const (
	LocationTypeInHome  AppointmentLocationType = "in_home"
	LocationTypeInSalon AppointmentLocationType = "in_salon"
)

type Appointment struct {
	ID              uuid.UUID           `json:"id" bson:"_id"`
	ClientID        uuid.UUID           `json:"clientId" bson:"clientId"`
	BarberID        uuid.UUID           `json:"barberId" bson:"barberId"`
	Status          AppointmentStatus   `json:"status" bson:"status"`
	ServiceType     string              `json:"serviceType" bson:"serviceType"`
	HairType        HairType            `json:"hairType" bson:"hairType"`
	SpecialRequests *string             `json:"specialRequests,omitempty" bson:"specialRequests,omitempty"`
	Location        AppointmentLocation `json:"location" bson:"location"`
	ScheduledFor    time.Time           `json:"scheduledFor" bson:"scheduledFor"`
	Duration        int                 `json:"duration" bson:"duration"`
	Price           float64             `json:"price" bson:"price"`
	AppliedCouponID *uuid.UUID          `json:"appliedCouponId,omitempty" bson:"appliedCouponId,omitempty"`
	PaymentStatus   PaymentStatus       `json:"paymentStatus" bson:"paymentStatus"`
	PaymentID       *string             `json:"paymentId,omitempty" bson:"paymentId,omitempty"`
	CreatedAt       time.Time           `json:"createdAt" bson:"createdAt"`
	UpdatedAt       time.Time           `json:"updatedAt" bson:"updatedAt"`
}

type AppointmentLocation struct {
	Type        AppointmentLocationType `json:"type" bson:"type"`
	Address     *string                 `json:"address,omitempty" bson:"address,omitempty"`
	Coordinates []float64               `json:"coordinates,omitempty" bson:"coordinates,omitempty"`
}
