package models

import (
	"time"

	"github.com/google/uuid"
)

type Review struct {
	ID            uuid.UUID `json:"id" bson:"_id"`
	AppointmentID uuid.UUID `json:"appointmentId" bson:"appointmentId"`
	ClientID      uuid.UUID `json:"clientId" bson:"clientId"`
	BarberID      uuid.UUID `json:"barberId" bson:"barberId"`
	Rating        int       `json:"rating" bson:"rating"`
	Comment       *string   `json:"comment,omitempty" bson:"comment,omitempty"`
	Photos        []string  `json:"photos,omitempty" bson:"photos,omitempty"`
	CreatedAt     time.Time `json:"createdAt" bson:"createdAt"`
}
