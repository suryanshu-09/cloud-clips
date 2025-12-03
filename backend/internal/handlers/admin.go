package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	storage *storage.MemoryStorage
}

func NewAdminHandler(storage *storage.MemoryStorage) *AdminHandler {
	return &AdminHandler{storage: storage}
}

// DashboardStats represents the admin dashboard statistics
type DashboardStats struct {
	TotalUsers            int                `json:"totalUsers"`
	TotalBarbers          int                `json:"totalBarbers"`
	TotalClients          int                `json:"totalClients"`
	PendingBarbers        int                `json:"pendingBarbers"`
	VerifiedBarbers       int                `json:"verifiedBarbers"`
	TotalAppointments     int                `json:"totalAppointments"`
	PendingAppointments   int                `json:"pendingAppointments"`
	CompletedAppointments int                `json:"completedAppointments"`
	TotalOrders           int                `json:"totalOrders"`
	TotalRevenue          float64            `json:"totalRevenue"`
	AppointmentRevenue    float64            `json:"appointmentRevenue"`
	ProductRevenue        float64            `json:"productRevenue"`
	TodayAppointments     int                `json:"todayAppointments"`
	TodayRevenue          float64            `json:"todayRevenue"`
	ActiveUsers           int                `json:"activeUsers"`
	BannedUsers           int                `json:"bannedUsers"`
	RevenueByMonth        map[string]float64 `json:"revenueByMonth"`
}

// GET /api/admin/dashboard/stats - Get dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	stats := DashboardStats{
		RevenueByMonth: make(map[string]float64),
	}

	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	// Count users by role and status
	for _, user := range h.storage.Users {
		stats.TotalUsers++
		switch user.Role {
		case models.RoleBarber:
			stats.TotalBarbers++
		case models.RoleClient:
			stats.TotalClients++
		}
		if user.Banned {
			stats.BannedUsers++
		}
		// Active users = users active in the last 30 days
		if user.LastActive.After(thirtyDaysAgo) {
			stats.ActiveUsers++
		}
	}

	// Count barber verification status
	for _, profile := range h.storage.BarberProfiles {
		if profile.IsVerified {
			stats.VerifiedBarbers++
		} else {
			stats.PendingBarbers++
		}
	}

	// Count appointments and calculate revenue
	for _, apt := range h.storage.Appointments {
		stats.TotalAppointments++
		switch apt.Status {
		case models.AppointmentStatusPending:
			stats.PendingAppointments++
		case models.AppointmentStatusCompleted:
			stats.CompletedAppointments++
			stats.AppointmentRevenue += apt.Price
		}

		// Today's appointments
		if apt.ScheduledFor.After(todayStart) && apt.ScheduledFor.Before(todayStart.AddDate(0, 0, 1)) {
			stats.TodayAppointments++
			if apt.Status == models.AppointmentStatusCompleted {
				stats.TodayRevenue += apt.Price
			}
		}

		// Revenue by month (last 12 months)
		if apt.Status == models.AppointmentStatusCompleted {
			monthKey := apt.ScheduledFor.Format("2006-01")
			stats.RevenueByMonth[monthKey] += apt.Price
		}
	}

	// Count orders and calculate product revenue
	for _, order := range h.storage.Orders {
		stats.TotalOrders++
		if order.Status == models.OrderStatusDelivered || order.Status == models.OrderStatusPaid {
			stats.ProductRevenue += order.TotalAmount
		}
	}

	stats.TotalRevenue = stats.AppointmentRevenue + stats.ProductRevenue

	c.JSON(http.StatusOK, stats)
}

// GET /api/admin/users - List all users with pagination and filters
func (h *AdminHandler) GetUsers(c *gin.Context) {
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Filters
	roleFilter := c.Query("role")
	bannedFilter := c.Query("banned")
	searchQuery := c.Query("search")

	var users []*models.User
	for _, user := range h.storage.Users {
		// Apply role filter
		if roleFilter != "" && string(user.Role) != roleFilter {
			continue
		}

		// Apply banned filter
		if bannedFilter == "true" && !user.Banned {
			continue
		}
		if bannedFilter == "false" && user.Banned {
			continue
		}

		// Apply search filter (name or email)
		if searchQuery != "" {
			if !containsIgnoreCase(user.Name, searchQuery) && !containsIgnoreCase(user.Email, searchQuery) {
				continue
			}
		}

		users = append(users, user)
	}

	// Calculate pagination
	total := len(users)
	start := (page - 1) * limit
	end := start + limit
	if start >= total {
		users = []*models.User{}
	} else {
		if end > total {
			end = total
		}
		users = users[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// PUT /api/admin/users/:id/role - Change user role
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role
	newRole := models.UserRole(req.Role)
	if newRole != models.RoleClient && newRole != models.RoleBarber && newRole != models.RoleAdmin {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'client', 'barber', or 'admin'"})
		return
	}

	oldRole := user.Role
	user.Role = newRole

	// If promoting to barber, create a barber profile if not exists
	if newRole == models.RoleBarber {
		profileExists := false
		for _, profile := range h.storage.BarberProfiles {
			if profile.UserID == user.ID {
				profileExists = true
				break
			}
		}
		if !profileExists {
			profile := &models.BarberProfile{
				ID:               uuid.New(),
				UserID:           user.ID,
				Specialties:      []string{},
				Services:         []models.Service{},
				Gallery:          []models.GalleryItem{},
				WorkingHours:     make(map[string]models.WorkingHour),
				ServiceLocations: []models.ServiceLocation{models.ServiceLocationInSalon},
				IsVerified:       false,
				CreatedAt:        time.Now(),
				UpdatedAt:        time.Now(),
			}
			h.storage.BarberProfiles[profile.ID] = profile
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User role updated successfully",
		"user":    user,
		"oldRole": oldRole,
		"newRole": newRole,
	})
}

// PUT /api/admin/users/:id/ban - Ban or unban a user
func (h *AdminHandler) BanUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, exists := h.storage.Users[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Prevent banning admins
	if user.Role == models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot ban an admin user"})
		return
	}

	var req struct {
		Ban    bool   `json:"ban"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Ban {
		now := time.Now()
		user.Banned = true
		user.BannedAt = &now
		if req.Reason != "" {
			user.BannedReason = &req.Reason
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "User banned successfully",
			"user":    user,
		})
	} else {
		user.Banned = false
		user.BannedAt = nil
		user.BannedReason = nil
		c.JSON(http.StatusOK, gin.H{
			"message": "User unbanned successfully",
			"user":    user,
		})
	}
}

// GET /api/admin/barbers/pending - Get pending barber verifications
func (h *AdminHandler) GetPendingBarbers(c *gin.Context) {
	var pendingBarbers []gin.H

	for _, profile := range h.storage.BarberProfiles {
		if !profile.IsVerified {
			// Get the associated user
			user, exists := h.storage.Users[profile.UserID]
			if !exists {
				continue
			}

			pendingBarbers = append(pendingBarbers, gin.H{
				"profile": profile,
				"user":    user,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pendingBarbers": pendingBarbers,
		"total":          len(pendingBarbers),
	})
}

// PUT /api/admin/barbers/:id/verify - Verify a barber
func (h *AdminHandler) VerifyBarber(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid barber profile ID"})
		return
	}

	profile, exists := h.storage.BarberProfiles[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barber profile not found"})
		return
	}

	var req struct {
		Verified bool   `json:"verified"`
		Reason   string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.IsVerified = req.Verified
	profile.UpdatedAt = time.Now()

	status := "verified"
	if !req.Verified {
		status = "rejected"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Barber " + status + " successfully",
		"profile": profile,
		"reason":  req.Reason,
	})
}

// GET /api/admin/appointments - Get all appointments with filters
func (h *AdminHandler) GetAppointments(c *gin.Context) {
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Filters
	statusFilter := c.Query("status")
	barberIDFilter := c.Query("barberId")
	clientIDFilter := c.Query("clientId")
	dateFrom := c.Query("dateFrom")
	dateTo := c.Query("dateTo")

	var appointments []*models.Appointment
	for _, apt := range h.storage.Appointments {
		// Apply status filter
		if statusFilter != "" && string(apt.Status) != statusFilter {
			continue
		}

		// Apply barber filter
		if barberIDFilter != "" {
			barberID, err := uuid.Parse(barberIDFilter)
			if err == nil && apt.BarberID != barberID {
				continue
			}
		}

		// Apply client filter
		if clientIDFilter != "" {
			clientID, err := uuid.Parse(clientIDFilter)
			if err == nil && apt.ClientID != clientID {
				continue
			}
		}

		// Apply date range filter
		if dateFrom != "" {
			from, err := time.Parse("2006-01-02", dateFrom)
			if err == nil && apt.ScheduledFor.Before(from) {
				continue
			}
		}
		if dateTo != "" {
			to, err := time.Parse("2006-01-02", dateTo)
			if err == nil && apt.ScheduledFor.After(to.AddDate(0, 0, 1)) {
				continue
			}
		}

		appointments = append(appointments, apt)
	}

	// Calculate pagination
	total := len(appointments)
	start := (page - 1) * limit
	end := start + limit
	if start >= total {
		appointments = []*models.Appointment{}
	} else {
		if end > total {
			end = total
		}
		appointments = appointments[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"appointments": appointments,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// GET /api/admin/orders - Get all orders with filters
func (h *AdminHandler) GetOrders(c *gin.Context) {
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Filters
	statusFilter := c.Query("status")
	userIDFilter := c.Query("userId")
	dateFrom := c.Query("dateFrom")
	dateTo := c.Query("dateTo")

	var orders []*models.Order
	for _, order := range h.storage.Orders {
		// Apply status filter
		if statusFilter != "" && string(order.Status) != statusFilter {
			continue
		}

		// Apply user filter
		if userIDFilter != "" {
			userID, err := uuid.Parse(userIDFilter)
			if err == nil && order.UserID != userID {
				continue
			}
		}

		// Apply date range filter
		if dateFrom != "" {
			from, err := time.Parse("2006-01-02", dateFrom)
			if err == nil && order.CreatedAt.Before(from) {
				continue
			}
		}
		if dateTo != "" {
			to, err := time.Parse("2006-01-02", dateTo)
			if err == nil && order.CreatedAt.After(to.AddDate(0, 0, 1)) {
				continue
			}
		}

		orders = append(orders, order)
	}

	// Calculate pagination
	total := len(orders)
	start := (page - 1) * limit
	end := start + limit
	if start >= total {
		orders = []*models.Order{}
	} else {
		if end > total {
			end = total
		}
		orders = orders[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// RevenueReport represents revenue data for a period
type RevenueReport struct {
	Period             string         `json:"period"`
	StartDate          string         `json:"startDate"`
	EndDate            string         `json:"endDate"`
	TotalRevenue       float64        `json:"totalRevenue"`
	AppointmentRevenue float64        `json:"appointmentRevenue"`
	ProductRevenue     float64        `json:"productRevenue"`
	AppointmentCount   int            `json:"appointmentCount"`
	OrderCount         int            `json:"orderCount"`
	AverageOrderValue  float64        `json:"averageOrderValue"`
	GrowthPercentage   float64        `json:"growthPercentage"`
	DailyBreakdown     []DailyRevenue `json:"dailyBreakdown,omitempty"`
}

type DailyRevenue struct {
	Date               string  `json:"date"`
	AppointmentRevenue float64 `json:"appointmentRevenue"`
	ProductRevenue     float64 `json:"productRevenue"`
	Total              float64 `json:"total"`
}

// GET /api/admin/revenue - Get revenue reports
func (h *AdminHandler) GetRevenueReport(c *gin.Context) {
	period := c.DefaultQuery("period", "month") // day, week, month, year
	dateStr := c.Query("date")

	var startDate, endDate time.Time
	now := time.Now()

	// Determine date range based on period
	if dateStr != "" {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
		now = parsedDate
	}

	switch period {
	case "day":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 0, 1)
	case "week":
		// Start from Monday
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		startDate = time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 0, 7)
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0)
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(1, 0, 0)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period. Use: day, week, month, year"})
		return
	}

	report := RevenueReport{
		Period:    period,
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
	}

	// Daily breakdown map
	dailyData := make(map[string]*DailyRevenue)

	// Calculate appointment revenue
	for _, apt := range h.storage.Appointments {
		if apt.Status == models.AppointmentStatusCompleted &&
			apt.ScheduledFor.After(startDate) && apt.ScheduledFor.Before(endDate) {
			report.AppointmentRevenue += apt.Price
			report.AppointmentCount++

			// Daily breakdown
			dayKey := apt.ScheduledFor.Format("2006-01-02")
			if dailyData[dayKey] == nil {
				dailyData[dayKey] = &DailyRevenue{Date: dayKey}
			}
			dailyData[dayKey].AppointmentRevenue += apt.Price
		}
	}

	// Calculate product revenue
	for _, order := range h.storage.Orders {
		if (order.Status == models.OrderStatusDelivered || order.Status == models.OrderStatusPaid) &&
			order.CreatedAt.After(startDate) && order.CreatedAt.Before(endDate) {
			report.ProductRevenue += order.TotalAmount
			report.OrderCount++

			// Daily breakdown
			dayKey := order.CreatedAt.Format("2006-01-02")
			if dailyData[dayKey] == nil {
				dailyData[dayKey] = &DailyRevenue{Date: dayKey}
			}
			dailyData[dayKey].ProductRevenue += order.TotalAmount
		}
	}

	report.TotalRevenue = report.AppointmentRevenue + report.ProductRevenue

	// Calculate average order value
	totalTransactions := report.AppointmentCount + report.OrderCount
	if totalTransactions > 0 {
		report.AverageOrderValue = report.TotalRevenue / float64(totalTransactions)
	}

	// Calculate growth percentage (compare to previous period)
	var prevStartDate, prevEndDate time.Time
	switch period {
	case "day":
		prevStartDate = startDate.AddDate(0, 0, -1)
		prevEndDate = startDate
	case "week":
		prevStartDate = startDate.AddDate(0, 0, -7)
		prevEndDate = startDate
	case "month":
		prevStartDate = startDate.AddDate(0, -1, 0)
		prevEndDate = startDate
	case "year":
		prevStartDate = startDate.AddDate(-1, 0, 0)
		prevEndDate = startDate
	}

	var prevRevenue float64
	for _, apt := range h.storage.Appointments {
		if apt.Status == models.AppointmentStatusCompleted &&
			apt.ScheduledFor.After(prevStartDate) && apt.ScheduledFor.Before(prevEndDate) {
			prevRevenue += apt.Price
		}
	}
	for _, order := range h.storage.Orders {
		if (order.Status == models.OrderStatusDelivered || order.Status == models.OrderStatusPaid) &&
			order.CreatedAt.After(prevStartDate) && order.CreatedAt.Before(prevEndDate) {
			prevRevenue += order.TotalAmount
		}
	}

	if prevRevenue > 0 {
		report.GrowthPercentage = ((report.TotalRevenue - prevRevenue) / prevRevenue) * 100
	} else if report.TotalRevenue > 0 {
		report.GrowthPercentage = 100.0
	}

	// Build daily breakdown array
	for _, daily := range dailyData {
		daily.Total = daily.AppointmentRevenue + daily.ProductRevenue
		report.DailyBreakdown = append(report.DailyBreakdown, *daily)
	}

	c.JSON(http.StatusOK, report)
}

// POST /api/admin/notifications/broadcast - Send notification to all users
func (h *AdminHandler) BroadcastNotification(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
		Type    string `json:"type"`   // promo, announcement, alert
		Target  string `json:"target"` // all, clients, barbers
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Type == "" {
		req.Type = "announcement"
	}
	if req.Target == "" {
		req.Target = "all"
	}

	now := time.Now()
	var sentCount int

	for _, user := range h.storage.Users {
		// Apply target filter
		if req.Target == "clients" && user.Role != models.RoleClient {
			continue
		}
		if req.Target == "barbers" && user.Role != models.RoleBarber {
			continue
		}

		// Skip banned users
		if user.Banned {
			continue
		}

		// Create notification
		notification := &models.Notification{
			ID:        uuid.New(),
			UserID:    user.ID,
			Type:      models.NotificationType(req.Type),
			Title:     req.Title,
			Body:      req.Message,
			IsRead:    false,
			CreatedAt: now,
		}
		h.storage.Notifications[notification.ID] = notification
		sentCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Notification broadcast successfully",
		"sentCount": sentCount,
		"title":     req.Title,
		"target":    req.Target,
	})
}

// GET /api/admin/analytics/users - User analytics
func (h *AdminHandler) GetUserAnalytics(c *gin.Context) {
	now := time.Now()

	analytics := gin.H{
		"totalUsers":    len(h.storage.Users),
		"newUsersToday": 0,
		"newUsersWeek":  0,
		"newUsersMonth": 0,
		"activeToday":   0,
		"activeWeek":    0,
		"activeMonth":   0,
		"byRole": gin.H{
			"clients": 0,
			"barbers": 0,
			"admins":  0,
		},
		"byProvider": gin.H{
			"email":    0,
			"google":   0,
			"apple":    0,
			"firebase": 0,
		},
	}

	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -7)
	monthStart := todayStart.AddDate(0, -1, 0)

	for _, user := range h.storage.Users {
		// Count by role
		switch user.Role {
		case models.RoleClient:
			analytics["byRole"].(gin.H)["clients"] = analytics["byRole"].(gin.H)["clients"].(int) + 1
		case models.RoleBarber:
			analytics["byRole"].(gin.H)["barbers"] = analytics["byRole"].(gin.H)["barbers"].(int) + 1
		case models.RoleAdmin:
			analytics["byRole"].(gin.H)["admins"] = analytics["byRole"].(gin.H)["admins"].(int) + 1
		}

		// Count by provider
		switch user.AuthProvider {
		case models.AuthProviderEmail:
			analytics["byProvider"].(gin.H)["email"] = analytics["byProvider"].(gin.H)["email"].(int) + 1
		case models.AuthProviderGoogle:
			analytics["byProvider"].(gin.H)["google"] = analytics["byProvider"].(gin.H)["google"].(int) + 1
		case models.AuthProviderApple:
			analytics["byProvider"].(gin.H)["apple"] = analytics["byProvider"].(gin.H)["apple"].(int) + 1
		case models.AuthProviderFirebase:
			analytics["byProvider"].(gin.H)["firebase"] = analytics["byProvider"].(gin.H)["firebase"].(int) + 1
		}

		// New users
		if user.CreatedAt.After(todayStart) {
			analytics["newUsersToday"] = analytics["newUsersToday"].(int) + 1
		}
		if user.CreatedAt.After(weekStart) {
			analytics["newUsersWeek"] = analytics["newUsersWeek"].(int) + 1
		}
		if user.CreatedAt.After(monthStart) {
			analytics["newUsersMonth"] = analytics["newUsersMonth"].(int) + 1
		}

		// Active users
		if user.LastActive.After(todayStart) {
			analytics["activeToday"] = analytics["activeToday"].(int) + 1
		}
		if user.LastActive.After(weekStart) {
			analytics["activeWeek"] = analytics["activeWeek"].(int) + 1
		}
		if user.LastActive.After(monthStart) {
			analytics["activeMonth"] = analytics["activeMonth"].(int) + 1
		}
	}

	c.JSON(http.StatusOK, analytics)
}

// Helper function for case-insensitive string contains
func containsIgnoreCase(s, substr string) bool {
	s, substr = strings.ToLower(s), strings.ToLower(substr)
	return strings.Contains(s, substr)
}
