package models

import (
	"time"

	"github.com/google/uuid"
)

// LoyaltyTier represents the user's loyalty status
type LoyaltyTier string

const (
	LoyaltyTierBronze   LoyaltyTier = "bronze"
	LoyaltyTierSilver   LoyaltyTier = "silver"
	LoyaltyTierGold     LoyaltyTier = "gold"
	LoyaltyTierPlatinum LoyaltyTier = "platinum"
)

// LoyaltyTransactionType represents the type of loyalty transaction
type LoyaltyTransactionType string

const (
	LoyaltyTransactionEarn   LoyaltyTransactionType = "earn"
	LoyaltyTransactionRedeem LoyaltyTransactionType = "redeem"
	LoyaltyTransactionExpire LoyaltyTransactionType = "expire"
	LoyaltyTransactionBonus  LoyaltyTransactionType = "bonus"
	LoyaltyTransactionAdjust LoyaltyTransactionType = "adjust"
)

// LoyaltyEarnSource represents how points were earned
type LoyaltyEarnSource string

const (
	LoyaltySourceBooking  LoyaltyEarnSource = "booking"
	LoyaltySourcePurchase LoyaltyEarnSource = "purchase"
	LoyaltySourceReferral LoyaltyEarnSource = "referral"
	LoyaltySourceReview   LoyaltyEarnSource = "review"
	LoyaltySourceBonus    LoyaltyEarnSource = "bonus"
	LoyaltySourceSignup   LoyaltyEarnSource = "signup"
)

// RewardType represents the type of reward
type RewardType string

const (
	RewardTypeDiscount    RewardType = "discount"
	RewardTypeFreeService RewardType = "free_service"
	RewardTypeFreeProduct RewardType = "free_product"
	RewardTypeUpgrade     RewardType = "upgrade"
)

// RewardStatus represents the status of a reward
type RewardStatus string

const (
	RewardStatusAvailable RewardStatus = "available"
	RewardStatusRedeemed  RewardStatus = "redeemed"
	RewardStatusExpired   RewardStatus = "expired"
)

// LoyaltyAccount represents a user's loyalty program account
type LoyaltyAccount struct {
	ID                 uuid.UUID   `json:"id" bson:"_id"`
	UserID             uuid.UUID   `json:"userId" bson:"userId"`
	CurrentPoints      int         `json:"currentPoints" bson:"currentPoints"`
	LifetimePoints     int         `json:"lifetimePoints" bson:"lifetimePoints"`
	Tier               LoyaltyTier `json:"tier" bson:"tier"`
	TierExpiresAt      *time.Time  `json:"tierExpiresAt,omitempty" bson:"tierExpiresAt,omitempty"`
	PointsToNextTier   int         `json:"pointsToNextTier" bson:"pointsToNextTier"`
	NextTier           LoyaltyTier `json:"nextTier,omitempty" bson:"nextTier,omitempty"`
	TotalRedemptions   int         `json:"totalRedemptions" bson:"totalRedemptions"`
	TotalSavings       float64     `json:"totalSavings" bson:"totalSavings"`
	MemberSince        time.Time   `json:"memberSince" bson:"memberSince"`
	LastActivityAt     time.Time   `json:"lastActivityAt" bson:"lastActivityAt"`
	PointsExpiringAt   *time.Time  `json:"pointsExpiringAt,omitempty" bson:"pointsExpiringAt,omitempty"`
	PointsExpiringSoon int         `json:"pointsExpiringSoon" bson:"pointsExpiringSoon"`
	CreatedAt          time.Time   `json:"createdAt" bson:"createdAt"`
	UpdatedAt          time.Time   `json:"updatedAt" bson:"updatedAt"`
}

// LoyaltyTransaction represents a single loyalty points transaction
type LoyaltyTransaction struct {
	ID            uuid.UUID              `json:"id" bson:"_id"`
	UserID        uuid.UUID              `json:"userId" bson:"userId"`
	Type          LoyaltyTransactionType `json:"type" bson:"type"`
	Points        int                    `json:"points" bson:"points"`
	Source        LoyaltyEarnSource      `json:"source,omitempty" bson:"source,omitempty"`
	Description   string                 `json:"description" bson:"description"`
	ReferenceID   *uuid.UUID             `json:"referenceId,omitempty" bson:"referenceId,omitempty"`     // appointment/order ID
	ReferenceType *string                `json:"referenceType,omitempty" bson:"referenceType,omitempty"` // "appointment", "order", "reward"
	BalanceAfter  int                    `json:"balanceAfter" bson:"balanceAfter"`
	ExpiresAt     *time.Time             `json:"expiresAt,omitempty" bson:"expiresAt,omitempty"`
	CreatedAt     time.Time              `json:"createdAt" bson:"createdAt"`
}

// LoyaltyReward represents a reward that can be redeemed
type LoyaltyReward struct {
	ID             uuid.UUID   `json:"id" bson:"_id"`
	Name           string      `json:"name" bson:"name"`
	Description    string      `json:"description" bson:"description"`
	Type           RewardType  `json:"type" bson:"type"`
	PointsCost     int         `json:"pointsCost" bson:"pointsCost"`
	Value          float64     `json:"value" bson:"value"` // Discount amount or percentage
	IsPercentage   bool        `json:"isPercentage" bson:"isPercentage"`
	MinTier        LoyaltyTier `json:"minTier" bson:"minTier"`
	ImageURL       *string     `json:"imageUrl,omitempty" bson:"imageUrl,omitempty"`
	ServiceID      *uuid.UUID  `json:"serviceId,omitempty" bson:"serviceId,omitempty"`           // For free service rewards
	ProductID      *uuid.UUID  `json:"productId,omitempty" bson:"productId,omitempty"`           // For free product rewards
	Stock          *int        `json:"stock,omitempty" bson:"stock,omitempty"`                   // Limited quantity rewards
	MaxRedemptions *int        `json:"maxRedemptions,omitempty" bson:"maxRedemptions,omitempty"` // Per user limit
	ValidFrom      time.Time   `json:"validFrom" bson:"validFrom"`
	ValidUntil     time.Time   `json:"validUntil" bson:"validUntil"`
	Terms          *string     `json:"terms,omitempty" bson:"terms,omitempty"`
	IsActive       bool        `json:"isActive" bson:"isActive"`
	CreatedAt      time.Time   `json:"createdAt" bson:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt" bson:"updatedAt"`
}

// UserReward represents a reward earned/redeemed by a user
type UserReward struct {
	ID            uuid.UUID      `json:"id" bson:"_id"`
	UserID        uuid.UUID      `json:"userId" bson:"userId"`
	RewardID      uuid.UUID      `json:"rewardId" bson:"rewardId"`
	Reward        *LoyaltyReward `json:"reward,omitempty" bson:"reward,omitempty"`
	Status        RewardStatus   `json:"status" bson:"status"`
	Code          string         `json:"code" bson:"code"` // Unique redemption code
	PointsSpent   int            `json:"pointsSpent" bson:"pointsSpent"`
	RedeemedAt    *time.Time     `json:"redeemedAt,omitempty" bson:"redeemedAt,omitempty"`
	UsedAt        *time.Time     `json:"usedAt,omitempty" bson:"usedAt,omitempty"`
	ExpiresAt     time.Time      `json:"expiresAt" bson:"expiresAt"`
	OrderID       *uuid.UUID     `json:"orderId,omitempty" bson:"orderId,omitempty"`
	AppointmentID *uuid.UUID     `json:"appointmentId,omitempty" bson:"appointmentId,omitempty"`
	CreatedAt     time.Time      `json:"createdAt" bson:"createdAt"`
}

// LoyaltyTierConfig represents the configuration for a loyalty tier
type LoyaltyTierConfig struct {
	Tier             LoyaltyTier `json:"tier" bson:"tier"`
	MinPoints        int         `json:"minPoints" bson:"minPoints"`
	PointsMultiplier float64     `json:"pointsMultiplier" bson:"pointsMultiplier"` // Earn rate multiplier
	DiscountRate     float64     `json:"discountRate" bson:"discountRate"`         // Discount percentage
	FreeServiceCount int         `json:"freeServiceCount" bson:"freeServiceCount"` // Free services per year
	PriorityBooking  bool        `json:"priorityBooking" bson:"priorityBooking"`
	ExclusiveRewards bool        `json:"exclusiveRewards" bson:"exclusiveRewards"`
	Benefits         []string    `json:"benefits" bson:"benefits"`
}

// LoyaltyProgramConfig represents the overall loyalty program configuration
type LoyaltyProgramConfig struct {
	PointsPerDollar    int                 `json:"pointsPerDollar"`
	PointsForSignup    int                 `json:"pointsForSignup"`
	PointsForReferral  int                 `json:"pointsForReferral"`
	PointsForReview    int                 `json:"pointsForReview"`
	PointsExpiryMonths int                 `json:"pointsExpiryMonths"`
	TierConfigs        []LoyaltyTierConfig `json:"tierConfigs"`
}

// Default tier thresholds
var DefaultTierThresholds = map[LoyaltyTier]int{
	LoyaltyTierBronze:   0,
	LoyaltyTierSilver:   500,
	LoyaltyTierGold:     1500,
	LoyaltyTierPlatinum: 5000,
}

// Default tier benefits
var DefaultTierBenefits = map[LoyaltyTier][]string{
	LoyaltyTierBronze: {
		"Earn 1 point per $1 spent",
		"Access to basic rewards",
		"Birthday bonus points",
	},
	LoyaltyTierSilver: {
		"Earn 1.25x points per $1 spent",
		"Access to silver-tier rewards",
		"5% discount on all services",
		"Priority booking",
	},
	LoyaltyTierGold: {
		"Earn 1.5x points per $1 spent",
		"Access to gold-tier rewards",
		"10% discount on all services",
		"Priority booking",
		"Free haircut on birthday",
	},
	LoyaltyTierPlatinum: {
		"Earn 2x points per $1 spent",
		"Access to all rewards",
		"15% discount on all services",
		"VIP priority booking",
		"Free haircut on birthday",
		"Exclusive event invitations",
		"Complimentary products",
	},
}

// GetTierForPoints calculates the tier for a given points amount
func GetTierForPoints(points int) LoyaltyTier {
	if points >= DefaultTierThresholds[LoyaltyTierPlatinum] {
		return LoyaltyTierPlatinum
	}
	if points >= DefaultTierThresholds[LoyaltyTierGold] {
		return LoyaltyTierGold
	}
	if points >= DefaultTierThresholds[LoyaltyTierSilver] {
		return LoyaltyTierSilver
	}
	return LoyaltyTierBronze
}

// GetPointsMultiplier returns the points earn multiplier for a tier
func GetPointsMultiplier(tier LoyaltyTier) float64 {
	switch tier {
	case LoyaltyTierPlatinum:
		return 2.0
	case LoyaltyTierGold:
		return 1.5
	case LoyaltyTierSilver:
		return 1.25
	default:
		return 1.0
	}
}

// GetDiscountRate returns the discount percentage for a tier
func GetDiscountRate(tier LoyaltyTier) float64 {
	switch tier {
	case LoyaltyTierPlatinum:
		return 15.0
	case LoyaltyTierGold:
		return 10.0
	case LoyaltyTierSilver:
		return 5.0
	default:
		return 0.0
	}
}

// GetNextTier returns the next tier above the current one
func GetNextTier(tier LoyaltyTier) LoyaltyTier {
	switch tier {
	case LoyaltyTierBronze:
		return LoyaltyTierSilver
	case LoyaltyTierSilver:
		return LoyaltyTierGold
	case LoyaltyTierGold:
		return LoyaltyTierPlatinum
	default:
		return LoyaltyTierPlatinum
	}
}

// GetPointsToNextTier calculates points needed to reach next tier
func GetPointsToNextTier(currentPoints int, currentTier LoyaltyTier) int {
	nextTier := GetNextTier(currentTier)
	if nextTier == currentTier {
		return 0 // Already at max tier
	}
	return DefaultTierThresholds[nextTier] - currentPoints
}

// Referral models

// ReferralStatus represents the status of a referral
type ReferralStatus string

const (
	ReferralStatusPending   ReferralStatus = "pending"
	ReferralStatusCompleted ReferralStatus = "completed"
	ReferralStatusExpired   ReferralStatus = "expired"
	ReferralStatusCancelled ReferralStatus = "cancelled"
)

// Referral represents a referral record
type Referral struct {
	ID             uuid.UUID      `json:"id" bson:"_id"`
	ReferrerID     uuid.UUID      `json:"referrerId" bson:"referrerId"`
	RefereeID      *uuid.UUID     `json:"refereeId,omitempty" bson:"refereeId,omitempty"`
	ReferralCode   string         `json:"referralCode" bson:"referralCode"`
	Status         ReferralStatus `json:"status" bson:"status"`
	ReferrerReward int            `json:"referrerReward" bson:"referrerReward"` // Points awarded to referrer
	RefereeReward  int            `json:"refereeReward" bson:"refereeReward"`   // Points awarded to referee
	RefereeEmail   *string        `json:"refereeEmail,omitempty" bson:"refereeEmail,omitempty"`
	CompletedAt    *time.Time     `json:"completedAt,omitempty" bson:"completedAt,omitempty"`
	ExpiresAt      time.Time      `json:"expiresAt" bson:"expiresAt"`
	CreatedAt      time.Time      `json:"createdAt" bson:"createdAt"`
}

// ReferralStats represents referral statistics for a user
type ReferralStats struct {
	TotalReferrals     int     `json:"totalReferrals"`
	CompletedReferrals int     `json:"completedReferrals"`
	PendingReferrals   int     `json:"pendingReferrals"`
	TotalPointsEarned  int     `json:"totalPointsEarned"`
	TotalSavings       float64 `json:"totalSavings"`
}

// ReferralConfig represents the referral program configuration
type ReferralConfig struct {
	ReferrerRewardPoints int  `json:"referrerRewardPoints"`
	RefereeRewardPoints  int  `json:"refereeRewardPoints"`
	ReferralExpiryDays   int  `json:"referralExpiryDays"`
	MaxReferralsPerUser  *int `json:"maxReferralsPerUser,omitempty"`
	RequireFirstBooking  bool `json:"requireFirstBooking"` // Referee must complete first booking
}

// Default referral config
var DefaultReferralConfig = ReferralConfig{
	ReferrerRewardPoints: 200,
	RefereeRewardPoints:  100,
	ReferralExpiryDays:   30,
	RequireFirstBooking:  true,
}
