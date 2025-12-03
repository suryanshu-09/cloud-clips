package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoyaltyHandler struct {
	storage *storage.MemoryStorage
}

func NewLoyaltyHandler(storage *storage.MemoryStorage) *LoyaltyHandler {
	return &LoyaltyHandler{storage: storage}
}

// ==================== Loyalty Account Endpoints ====================

// GET /api/loyalty/account - Get user's loyalty account
func (h *LoyaltyHandler) GetLoyaltyAccount(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	account, exists := h.storage.LoyaltyAccounts[userID]
	if !exists {
		// Create new account for user
		account = h.createLoyaltyAccount(userID)
	}

	// Get tier benefits
	benefits := models.DefaultTierBenefits[account.Tier]

	c.JSON(http.StatusOK, gin.H{
		"account":  account,
		"benefits": benefits,
		"tierConfig": gin.H{
			"thresholds": models.DefaultTierThresholds,
			"multiplier": models.GetPointsMultiplier(account.Tier),
			"discount":   models.GetDiscountRate(account.Tier),
		},
	})
}

// POST /api/loyalty/enroll - Enroll user in loyalty program
func (h *LoyaltyHandler) EnrollInLoyalty(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if already enrolled
	if _, exists := h.storage.LoyaltyAccounts[userID]; exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already enrolled in loyalty program"})
		return
	}

	// Create loyalty account with signup bonus
	account := h.createLoyaltyAccount(userID)

	// Add signup bonus
	signupBonus := 50 // Default signup bonus points
	h.addPointsTransaction(userID, signupBonus, models.LoyaltyTransactionEarn, models.LoyaltySourceSignup, "Welcome bonus for joining the loyalty program", nil)

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Successfully enrolled in loyalty program",
		"account":     account,
		"signupBonus": signupBonus,
	})
}

// GET /api/loyalty/transactions - Get loyalty transactions
func (h *LoyaltyHandler) GetLoyaltyTransactions(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	transactionType := c.Query("type") // earn, redeem, etc.

	var transactions []*models.LoyaltyTransaction
	for _, tx := range h.storage.LoyaltyTransactions {
		if tx.UserID == userID {
			if transactionType == "" || string(tx.Type) == transactionType {
				transactions = append(transactions, tx)
			}
		}
	}

	// Sort by date (newest first) and paginate
	total := len(transactions)
	start := (page - 1) * limit
	end := start + limit
	if start >= total {
		transactions = []*models.LoyaltyTransaction{}
	} else {
		if end > total {
			end = total
		}
		transactions = transactions[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"page":         page,
		"limit":        limit,
		"total":        total,
		"totalPages":   (total + limit - 1) / limit,
	})
}

// POST /api/loyalty/earn - Manually award points (admin or system)
func (h *LoyaltyHandler) EarnPoints(c *gin.Context) {
	var req struct {
		UserID      string  `json:"userId" binding:"required"`
		Points      int     `json:"points" binding:"required,min=1"`
		Source      string  `json:"source" binding:"required"`
		Description string  `json:"description"`
		ReferenceID *string `json:"referenceId"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify user exists
	if _, exists := h.storage.Users[userID]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get or create loyalty account
	account, exists := h.storage.LoyaltyAccounts[userID]
	if !exists {
		account = h.createLoyaltyAccount(userID)
	}

	// Apply tier multiplier
	multiplier := models.GetPointsMultiplier(account.Tier)
	earnedPoints := int(float64(req.Points) * multiplier)

	var refID *uuid.UUID
	if req.ReferenceID != nil {
		id, _ := uuid.Parse(*req.ReferenceID)
		refID = &id
	}

	// Add transaction
	tx := h.addPointsTransaction(userID, earnedPoints, models.LoyaltyTransactionEarn, models.LoyaltyEarnSource(req.Source), req.Description, refID)

	c.JSON(http.StatusOK, gin.H{
		"transaction":   tx,
		"basePoints":    req.Points,
		"multiplier":    multiplier,
		"earnedPoints":  earnedPoints,
		"currentPoints": account.CurrentPoints,
		"tier":          account.Tier,
	})
}

// ==================== Rewards Endpoints ====================

// GET /api/loyalty/rewards - Get available rewards
func (h *LoyaltyHandler) GetRewards(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user's loyalty account for tier filtering
	account, exists := h.storage.LoyaltyAccounts[userID]
	if !exists {
		account = h.createLoyaltyAccount(userID)
	}

	now := time.Now()
	var rewards []*models.LoyaltyReward
	for _, reward := range h.storage.LoyaltyRewards {
		// Only show active rewards within validity period
		if reward.IsActive && reward.ValidFrom.Before(now) && reward.ValidUntil.After(now) {
			// Check tier requirement
			if h.isTierEligible(account.Tier, reward.MinTier) {
				rewards = append(rewards, reward)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"rewards":       rewards,
		"currentPoints": account.CurrentPoints,
		"tier":          account.Tier,
	})
}

// GET /api/loyalty/rewards/:id - Get reward details
func (h *LoyaltyHandler) GetReward(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reward ID"})
		return
	}

	reward, exists := h.storage.LoyaltyRewards[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
		return
	}

	c.JSON(http.StatusOK, reward)
}

// POST /api/loyalty/rewards/:id/redeem - Redeem a reward
func (h *LoyaltyHandler) RedeemReward(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	rewardID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reward ID"})
		return
	}

	// Get reward
	reward, exists := h.storage.LoyaltyRewards[rewardID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
		return
	}

	// Validate reward is active and valid
	now := time.Now()
	if !reward.IsActive || reward.ValidFrom.After(now) || reward.ValidUntil.Before(now) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reward is not currently available"})
		return
	}

	// Check stock
	if reward.Stock != nil && *reward.Stock <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reward is out of stock"})
		return
	}

	// Get user's loyalty account
	account, exists := h.storage.LoyaltyAccounts[userID]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enrolled in loyalty program"})
		return
	}

	// Check tier eligibility
	if !h.isTierEligible(account.Tier, reward.MinTier) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Your tier is not eligible for this reward"})
		return
	}

	// Check points balance
	if account.CurrentPoints < reward.PointsCost {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":         "Insufficient points",
			"required":      reward.PointsCost,
			"currentPoints": account.CurrentPoints,
		})
		return
	}

	// Check user's redemption limit
	if reward.MaxRedemptions != nil {
		redemptionCount := 0
		for _, ur := range h.storage.UserRewards {
			if ur.UserID == userID && ur.RewardID == rewardID {
				redemptionCount++
			}
		}
		if redemptionCount >= *reward.MaxRedemptions {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You have reached the maximum redemptions for this reward"})
			return
		}
	}

	// Deduct points
	account.CurrentPoints -= reward.PointsCost
	account.TotalRedemptions++
	account.TotalSavings += reward.Value
	account.LastActivityAt = now
	account.UpdatedAt = now

	// Create user reward
	userReward := &models.UserReward{
		ID:          uuid.New(),
		UserID:      userID,
		RewardID:    rewardID,
		Reward:      reward,
		Status:      models.RewardStatusAvailable,
		Code:        h.generateRewardCode(),
		PointsSpent: reward.PointsCost,
		RedeemedAt:  &now,
		ExpiresAt:   now.AddDate(0, 3, 0), // 3 months validity
		CreatedAt:   now,
	}
	h.storage.UserRewards[userReward.ID] = userReward

	// Decrease stock if limited
	if reward.Stock != nil {
		*reward.Stock--
	}

	// Record transaction
	h.addPointsTransaction(userID, -reward.PointsCost, models.LoyaltyTransactionRedeem, "", "Redeemed reward: "+reward.Name, &rewardID)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Reward redeemed successfully",
		"userReward":    userReward,
		"currentPoints": account.CurrentPoints,
	})
}

// GET /api/loyalty/my-rewards - Get user's redeemed rewards
func (h *LoyaltyHandler) GetMyRewards(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	status := c.Query("status") // available, redeemed, expired

	var userRewards []*models.UserReward
	now := time.Now()
	for _, ur := range h.storage.UserRewards {
		if ur.UserID == userID {
			// Update expired status
			if ur.Status == models.RewardStatusAvailable && ur.ExpiresAt.Before(now) {
				ur.Status = models.RewardStatusExpired
			}

			if status == "" || string(ur.Status) == status {
				userRewards = append(userRewards, ur)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"rewards": userRewards,
		"total":   len(userRewards),
	})
}

// POST /api/loyalty/my-rewards/:id/use - Use a redeemed reward
func (h *LoyaltyHandler) UseReward(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	rewardID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reward ID"})
		return
	}

	var req struct {
		AppointmentID *string `json:"appointmentId"`
		OrderID       *string `json:"orderId"`
	}
	c.ShouldBindJSON(&req)

	userReward, exists := h.storage.UserRewards[rewardID]
	if !exists || userReward.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
		return
	}

	if userReward.Status != models.RewardStatusAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reward is not available"})
		return
	}

	now := time.Now()
	if userReward.ExpiresAt.Before(now) {
		userReward.Status = models.RewardStatusExpired
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reward has expired"})
		return
	}

	// Mark as used
	userReward.Status = models.RewardStatusRedeemed
	userReward.UsedAt = &now

	if req.AppointmentID != nil {
		id, _ := uuid.Parse(*req.AppointmentID)
		userReward.AppointmentID = &id
	}
	if req.OrderID != nil {
		id, _ := uuid.Parse(*req.OrderID)
		userReward.OrderID = &id
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Reward used successfully",
		"reward":  userReward,
	})
}

// ==================== Referral Endpoints ====================

// GET /api/loyalty/referral/code - Get user's referral code
func (h *LoyaltyHandler) GetReferralCode(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Find existing referral code or create one
	var referralCode string
	for _, ref := range h.storage.Referrals {
		if ref.ReferrerID == userID && ref.RefereeID == nil {
			referralCode = ref.ReferralCode
			break
		}
	}

	if referralCode == "" {
		// Generate new referral code
		referralCode = h.generateReferralCode()
		referral := &models.Referral{
			ID:             uuid.New(),
			ReferrerID:     userID,
			ReferralCode:   referralCode,
			Status:         models.ReferralStatusPending,
			ReferrerReward: models.DefaultReferralConfig.ReferrerRewardPoints,
			RefereeReward:  models.DefaultReferralConfig.RefereeRewardPoints,
			ExpiresAt:      time.Now().AddDate(0, 0, models.DefaultReferralConfig.ReferralExpiryDays),
			CreatedAt:      time.Now(),
		}
		h.storage.Referrals[referral.ID] = referral
	}

	// Get referral stats
	stats := h.getUserReferralStats(userID)

	c.JSON(http.StatusOK, gin.H{
		"code":   referralCode,
		"stats":  stats,
		"config": models.DefaultReferralConfig,
	})
}

// POST /api/loyalty/referral/apply - Apply referral code (for new users)
func (h *LoyaltyHandler) ApplyReferralCode(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already used a referral code
	for _, ref := range h.storage.Referrals {
		if ref.RefereeID != nil && *ref.RefereeID == userID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You have already used a referral code"})
			return
		}
	}

	// Find the referral
	var referral *models.Referral
	for _, ref := range h.storage.Referrals {
		if ref.ReferralCode == req.Code && ref.Status == models.ReferralStatusPending {
			referral = ref
			break
		}
	}

	if referral == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired referral code"})
		return
	}

	// Can't refer yourself
	if referral.ReferrerID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot use your own referral code"})
		return
	}

	// Check expiry
	if referral.ExpiresAt.Before(time.Now()) {
		referral.Status = models.ReferralStatusExpired
		c.JSON(http.StatusBadRequest, gin.H{"error": "Referral code has expired"})
		return
	}

	// Apply referral
	now := time.Now()
	referral.RefereeID = &userID
	referral.Status = models.ReferralStatusCompleted
	referral.CompletedAt = &now

	// Create new referral code for the original referrer
	newReferral := &models.Referral{
		ID:             uuid.New(),
		ReferrerID:     referral.ReferrerID,
		ReferralCode:   h.generateReferralCode(),
		Status:         models.ReferralStatusPending,
		ReferrerReward: models.DefaultReferralConfig.ReferrerRewardPoints,
		RefereeReward:  models.DefaultReferralConfig.RefereeRewardPoints,
		ExpiresAt:      time.Now().AddDate(0, 0, models.DefaultReferralConfig.ReferralExpiryDays),
		CreatedAt:      time.Now(),
	}
	h.storage.Referrals[newReferral.ID] = newReferral

	// Award points to referrer
	h.addPointsTransaction(
		referral.ReferrerID,
		referral.ReferrerReward,
		models.LoyaltyTransactionEarn,
		models.LoyaltySourceReferral,
		"Referral bonus - your friend joined!",
		&referral.ID,
	)

	// Award points to referee
	h.addPointsTransaction(
		userID,
		referral.RefereeReward,
		models.LoyaltyTransactionEarn,
		models.LoyaltySourceReferral,
		"Welcome bonus - referred by a friend!",
		&referral.ID,
	)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Referral code applied successfully",
		"pointsEarned": referral.RefereeReward,
	})
}

// GET /api/loyalty/referrals - Get user's referral history
func (h *LoyaltyHandler) GetReferrals(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var referrals []*models.Referral
	for _, ref := range h.storage.Referrals {
		if ref.ReferrerID == userID && ref.RefereeID != nil {
			referrals = append(referrals, ref)
		}
	}

	stats := h.getUserReferralStats(userID)

	c.JSON(http.StatusOK, gin.H{
		"referrals": referrals,
		"stats":     stats,
	})
}

// ==================== Admin Endpoints ====================

// POST /api/admin/loyalty/rewards - Create a new reward (admin)
func (h *LoyaltyHandler) CreateReward(c *gin.Context) {
	var req struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description" binding:"required"`
		Type           string  `json:"type" binding:"required"`
		PointsCost     int     `json:"pointsCost" binding:"required,min=1"`
		Value          float64 `json:"value" binding:"required"`
		IsPercentage   bool    `json:"isPercentage"`
		MinTier        string  `json:"minTier"`
		ImageURL       *string `json:"imageUrl"`
		Stock          *int    `json:"stock"`
		MaxRedemptions *int    `json:"maxRedemptions"`
		ValidDays      int     `json:"validDays"`
		Terms          *string `json:"terms"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validDays := req.ValidDays
	if validDays <= 0 {
		validDays = 90 // Default 90 days
	}

	now := time.Now()
	reward := &models.LoyaltyReward{
		ID:             uuid.New(),
		Name:           req.Name,
		Description:    req.Description,
		Type:           models.RewardType(req.Type),
		PointsCost:     req.PointsCost,
		Value:          req.Value,
		IsPercentage:   req.IsPercentage,
		MinTier:        models.LoyaltyTier(req.MinTier),
		ImageURL:       req.ImageURL,
		Stock:          req.Stock,
		MaxRedemptions: req.MaxRedemptions,
		ValidFrom:      now,
		ValidUntil:     now.AddDate(0, 0, validDays),
		Terms:          req.Terms,
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if reward.MinTier == "" {
		reward.MinTier = models.LoyaltyTierBronze
	}

	h.storage.LoyaltyRewards[reward.ID] = reward

	c.JSON(http.StatusCreated, reward)
}

// PUT /api/admin/loyalty/rewards/:id - Update a reward (admin)
func (h *LoyaltyHandler) UpdateReward(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reward ID"})
		return
	}

	reward, exists := h.storage.LoyaltyRewards[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
		return
	}

	var req struct {
		Name           *string  `json:"name"`
		Description    *string  `json:"description"`
		PointsCost     *int     `json:"pointsCost"`
		Value          *float64 `json:"value"`
		IsPercentage   *bool    `json:"isPercentage"`
		MinTier        *string  `json:"minTier"`
		ImageURL       *string  `json:"imageUrl"`
		Stock          *int     `json:"stock"`
		MaxRedemptions *int     `json:"maxRedemptions"`
		IsActive       *bool    `json:"isActive"`
		Terms          *string  `json:"terms"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		reward.Name = *req.Name
	}
	if req.Description != nil {
		reward.Description = *req.Description
	}
	if req.PointsCost != nil {
		reward.PointsCost = *req.PointsCost
	}
	if req.Value != nil {
		reward.Value = *req.Value
	}
	if req.IsPercentage != nil {
		reward.IsPercentage = *req.IsPercentage
	}
	if req.MinTier != nil {
		reward.MinTier = models.LoyaltyTier(*req.MinTier)
	}
	if req.ImageURL != nil {
		reward.ImageURL = req.ImageURL
	}
	if req.Stock != nil {
		reward.Stock = req.Stock
	}
	if req.MaxRedemptions != nil {
		reward.MaxRedemptions = req.MaxRedemptions
	}
	if req.IsActive != nil {
		reward.IsActive = *req.IsActive
	}
	if req.Terms != nil {
		reward.Terms = req.Terms
	}
	reward.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, reward)
}

// DELETE /api/admin/loyalty/rewards/:id - Delete a reward (admin)
func (h *LoyaltyHandler) DeleteReward(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reward ID"})
		return
	}

	if _, exists := h.storage.LoyaltyRewards[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
		return
	}

	delete(h.storage.LoyaltyRewards, id)
	c.JSON(http.StatusOK, gin.H{"message": "Reward deleted successfully"})
}

// GET /api/admin/loyalty/stats - Get loyalty program stats (admin)
func (h *LoyaltyHandler) GetLoyaltyStats(c *gin.Context) {
	var totalMembers, totalPoints, totalRedemptions int
	var totalSavings float64
	tierCounts := make(map[string]int)

	for _, account := range h.storage.LoyaltyAccounts {
		totalMembers++
		totalPoints += account.CurrentPoints
		totalRedemptions += account.TotalRedemptions
		totalSavings += account.TotalSavings
		tierCounts[string(account.Tier)]++
	}

	var activeRewards int
	for _, reward := range h.storage.LoyaltyRewards {
		if reward.IsActive {
			activeRewards++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"totalMembers":             totalMembers,
		"totalPointsInCirculation": totalPoints,
		"totalRedemptions":         totalRedemptions,
		"totalSavings":             totalSavings,
		"tierDistribution":         tierCounts,
		"activeRewards":            activeRewards,
	})
}

// POST /api/admin/loyalty/adjust - Manually adjust user points (admin)
func (h *LoyaltyHandler) AdjustPoints(c *gin.Context) {
	var req struct {
		UserID      string `json:"userId" binding:"required"`
		Points      int    `json:"points" binding:"required"`
		Description string `json:"description" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	account, exists := h.storage.LoyaltyAccounts[userID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not enrolled in loyalty program"})
		return
	}

	// Prevent negative balance
	if account.CurrentPoints+req.Points < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Adjustment would result in negative balance"})
		return
	}

	tx := h.addPointsTransaction(userID, req.Points, models.LoyaltyTransactionAdjust, "", req.Description, nil)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Points adjusted successfully",
		"transaction":   tx,
		"currentPoints": account.CurrentPoints,
	})
}

// ==================== Helper Methods ====================

func (h *LoyaltyHandler) createLoyaltyAccount(userID uuid.UUID) *models.LoyaltyAccount {
	now := time.Now()
	account := &models.LoyaltyAccount{
		ID:               uuid.New(),
		UserID:           userID,
		CurrentPoints:    0,
		LifetimePoints:   0,
		Tier:             models.LoyaltyTierBronze,
		PointsToNextTier: models.DefaultTierThresholds[models.LoyaltyTierSilver],
		NextTier:         models.LoyaltyTierSilver,
		MemberSince:      now,
		LastActivityAt:   now,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	h.storage.LoyaltyAccounts[userID] = account
	return account
}

func (h *LoyaltyHandler) addPointsTransaction(userID uuid.UUID, points int, txType models.LoyaltyTransactionType, source models.LoyaltyEarnSource, description string, refID *uuid.UUID) *models.LoyaltyTransaction {
	account := h.storage.LoyaltyAccounts[userID]
	if account == nil {
		account = h.createLoyaltyAccount(userID)
	}

	// Update account
	account.CurrentPoints += points
	if points > 0 {
		account.LifetimePoints += points
		// Check tier upgrade
		newTier := models.GetTierForPoints(account.LifetimePoints)
		if newTier != account.Tier {
			account.Tier = newTier
		}
		account.PointsToNextTier = models.GetPointsToNextTier(account.LifetimePoints, account.Tier)
		account.NextTier = models.GetNextTier(account.Tier)
	}
	account.LastActivityAt = time.Now()
	account.UpdatedAt = time.Now()

	// Create transaction record
	tx := &models.LoyaltyTransaction{
		ID:           uuid.New(),
		UserID:       userID,
		Type:         txType,
		Points:       points,
		Source:       source,
		Description:  description,
		ReferenceID:  refID,
		BalanceAfter: account.CurrentPoints,
		CreatedAt:    time.Now(),
	}

	// Set expiry for earned points (1 year)
	if txType == models.LoyaltyTransactionEarn {
		expiresAt := time.Now().AddDate(1, 0, 0)
		tx.ExpiresAt = &expiresAt
	}

	h.storage.LoyaltyTransactions[tx.ID] = tx
	return tx
}

func (h *LoyaltyHandler) isTierEligible(userTier, requiredTier models.LoyaltyTier) bool {
	tierOrder := map[models.LoyaltyTier]int{
		models.LoyaltyTierBronze:   0,
		models.LoyaltyTierSilver:   1,
		models.LoyaltyTierGold:     2,
		models.LoyaltyTierPlatinum: 3,
	}
	return tierOrder[userTier] >= tierOrder[requiredTier]
}

func (h *LoyaltyHandler) generateRewardCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return "RWD-" + hex.EncodeToString(bytes)
}

func (h *LoyaltyHandler) generateReferralCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return "REF-" + hex.EncodeToString(bytes)
}

func (h *LoyaltyHandler) getUserReferralStats(userID uuid.UUID) models.ReferralStats {
	stats := models.ReferralStats{}
	for _, ref := range h.storage.Referrals {
		if ref.ReferrerID == userID && ref.RefereeID != nil {
			stats.TotalReferrals++
			if ref.Status == models.ReferralStatusCompleted {
				stats.CompletedReferrals++
				stats.TotalPointsEarned += ref.ReferrerReward
			} else if ref.Status == models.ReferralStatusPending {
				stats.PendingReferrals++
			}
		}
	}
	return stats
}
