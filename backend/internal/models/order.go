package models

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID              uuid.UUID   `json:"id" bson:"_id"`
	UserID          uuid.UUID   `json:"userId" bson:"userId"`
	Status          OrderStatus `json:"status" bson:"status"`
	Items           []OrderItem `json:"items" bson:"items"`
	TotalAmount     float64     `json:"totalAmount" bson:"totalAmount"`
	ShippingAddress Address     `json:"shippingAddress" bson:"shippingAddress"`
	PaymentID       *string     `json:"paymentId,omitempty" bson:"paymentId,omitempty"`
	CreatedAt       time.Time   `json:"createdAt" bson:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt" bson:"updatedAt"`
}

type OrderItem struct {
	ProductID uuid.UUID `json:"productId" bson:"productId"`
	Quantity  int       `json:"quantity" bson:"quantity"`
	Price     float64   `json:"price" bson:"price"`
}

type Address struct {
	Line1 string `json:"line1" bson:"line1"`
	Line2 string `json:"line2,omitempty" bson:"line2,omitempty"`
	City  string `json:"city" bson:"city"`
	State string `json:"state" bson:"state"`
	Zip   string `json:"zip" bson:"zip"`
}
