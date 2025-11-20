package models

import (
	"time"

	"github.com/google/uuid"
)

type CouponType string

const (
	CouponTypePercentage CouponType = "percentage"
	CouponTypeFixed      CouponType = "fixed"
)

type Coupon struct {
	ID           uuid.UUID    `json:"id" bson:"_id"`
	Code         string       `json:"code" bson:"code"`
	Type         CouponType   `json:"type" bson:"type"`
	Value        float64      `json:"value" bson:"value"`
	MinAmount    *float64     `json:"minAmount,omitempty" bson:"minAmount,omitempty"`
	MaxDiscount  *float64     `json:"maxDiscount,omitempty" bson:"maxDiscount,omitempty"`
	ValidFrom    time.Time    `json:"validFrom" bson:"validFrom"`
	ValidUntil   time.Time    `json:"validUntil" bson:"validUntil"`
	UsageLimit   *int         `json:"usageLimit,omitempty" bson:"usageLimit,omitempty"`
	UsageCount   int          `json:"usageCount" bson:"usageCount"`
	ApplicableTo ApplicableTo `json:"applicableTo" bson:"applicableTo"`
}

type ApplicableTo struct {
	Services   bool        `json:"services" bson:"services"`
	Products   bool        `json:"products" bson:"products"`
	Categories []string    `json:"categories,omitempty" bson:"categories,omitempty"`
	BarberIDs  []uuid.UUID `json:"barberIds,omitempty" bson:"barberIds,omitempty"`
}
