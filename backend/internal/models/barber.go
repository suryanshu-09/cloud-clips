package models

import (
	"time"

	"github.com/google/uuid"
)

type ServiceLocation string

const (
	ServiceLocationInHome  ServiceLocation = "in_home"
	ServiceLocationInSalon ServiceLocation = "in_salon"
)

type BarberProfile struct {
	ID               uuid.UUID              `json:"id" bson:"_id"`
	UserID           uuid.UUID              `json:"userId" bson:"userId"`
	BusinessName     *string                `json:"businessName,omitempty" bson:"businessName,omitempty"`
	Bio              *string                `json:"bio,omitempty" bson:"bio,omitempty"`
	Specialties      []string               `json:"specialties" bson:"specialties"`
	Experience       int                    `json:"experience" bson:"experience"`
	ServiceLocations []ServiceLocation      `json:"serviceLocations" bson:"serviceLocations"`
	WorkingHours     map[string]WorkingHour `json:"workingHours" bson:"workingHours"`
	Services         []Service              `json:"services" bson:"services"`
	Gallery          []GalleryItem          `json:"gallery" bson:"gallery"`
	Rating           float64                `json:"rating" bson:"rating"`
	TotalReviews     int                    `json:"totalReviews" bson:"totalReviews"`
	IsVerified       bool                   `json:"isVerified" bson:"isVerified"`
	Location         Location               `json:"location" bson:"location"`
	Address          *string                `json:"address,omitempty" bson:"address,omitempty"`
	CreatedAt        time.Time              `json:"createdAt" bson:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt" bson:"updatedAt"`
}

type WorkingHour struct {
	Start       string `json:"start" bson:"start"`
	End         string `json:"end" bson:"end"`
	IsAvailable bool   `json:"isAvailable" bson:"isAvailable"`
}

type Service struct {
	Name        string  `json:"name" bson:"name"`
	Price       float64 `json:"price" bson:"price"`
	Duration    int     `json:"duration" bson:"duration"`
	Description *string `json:"description,omitempty" bson:"description,omitempty"`
}

type GalleryItem struct {
	URL  string `json:"url" bson:"url"`
	Type string `json:"type" bson:"type"`
}
