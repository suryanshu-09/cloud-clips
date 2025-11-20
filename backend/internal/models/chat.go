package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatMessage struct {
	ID            uuid.UUID  `json:"id" bson:"_id"`
	AppointmentID uuid.UUID  `json:"appointmentId" bson:"appointmentId"`
	SenderID      uuid.UUID  `json:"senderId" bson:"senderId"`
	ReceiverID    uuid.UUID  `json:"receiverId" bson:"receiverId"`
	Content       string     `json:"content" bson:"content"`
	CreatedAt     time.Time  `json:"createdAt" bson:"createdAt"`
	ReadAt        *time.Time `json:"readAt,omitempty" bson:"readAt,omitempty"`
}
