package models

import (
	"github.com/google/uuid"
)

type Product struct {
	ID           uuid.UUID         `json:"id" bson:"_id"`
	Name         string            `json:"name" bson:"name"`
	Description  string            `json:"description" bson:"description"`
	Category     string            `json:"category" bson:"category"`
	Price        float64           `json:"price" bson:"price"`
	Images       []string          `json:"images" bson:"images"`
	Stock        int               `json:"stock" bson:"stock"`
	Rating       float64           `json:"rating" bson:"rating"`
	TotalReviews int               `json:"totalReviews" bson:"totalReviews"`
	BarberID     *uuid.UUID        `json:"barberId,omitempty" bson:"barberId,omitempty"`
	Specs        map[string]string `json:"specs" bson:"specs"`
}
