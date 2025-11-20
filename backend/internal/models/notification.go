package models

import (
	"time"

	"github.com/google/uuid"
)

type NotificationType string

const (
	NotificationTypeAppointment NotificationType = "appointment"
	NotificationTypeChat        NotificationType = "chat"
	NotificationTypePromo       NotificationType = "promo"
	NotificationTypeSystem      NotificationType = "system"
)

type Notification struct {
	ID        uuid.UUID        `json:"id" bson:"_id"`
	UserID    uuid.UUID        `json:"userId" bson:"userId"`
	Type      NotificationType `json:"type" bson:"type"`
	Title     string           `json:"title" bson:"title"`
	Body      string           `json:"body" bson:"body"`
	Data      map[string]any   `json:"data,omitempty" bson:"data,omitempty"`
	IsRead    bool             `json:"isRead" bson:"isRead"`
	CreatedAt time.Time        `json:"createdAt" bson:"createdAt"`
}
