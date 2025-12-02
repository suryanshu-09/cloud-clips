package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChatHandler struct {
	storage *storage.MemoryStorage
}

func NewChatHandler(storage *storage.MemoryStorage) *ChatHandler {
	return &ChatHandler{storage: storage}
}

// Request types
type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

// GET /api/chats - List user's chat threads
func (h *ChatHandler) GetChats(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	// Group messages by appointment ID
	type ChatThread struct {
		AppointmentID uuid.UUID           `json:"appointmentId"`
		Appointment   *models.Appointment `json:"appointment"`
		OtherUser     *models.User        `json:"otherUser"`
		LastMessage   *models.ChatMessage `json:"lastMessage"`
		UnreadCount   int                 `json:"unreadCount"`
	}

	threads := make(map[uuid.UUID]*ChatThread)

	for _, message := range h.storage.ChatMessages {
		// Only include messages where user is sender or receiver
		if message.SenderID != userID && message.ReceiverID != userID {
			continue
		}

		thread, exists := threads[message.AppointmentID]
		if !exists {
			appointment := h.storage.Appointments[message.AppointmentID]

			// Determine the other user
			var otherUserID uuid.UUID
			if message.SenderID == userID {
				otherUserID = message.ReceiverID
			} else {
				otherUserID = message.SenderID
			}
			otherUser := h.storage.Users[otherUserID]

			thread = &ChatThread{
				AppointmentID: message.AppointmentID,
				Appointment:   appointment,
				OtherUser:     otherUser,
				UnreadCount:   0,
			}
			threads[message.AppointmentID] = thread
		}

		// Update last message if this one is newer
		if thread.LastMessage == nil || message.CreatedAt.After(thread.LastMessage.CreatedAt) {
			thread.LastMessage = message
		}

		// Count unread messages
		if message.ReceiverID == userID && message.ReadAt == nil {
			thread.UnreadCount++
		}
	}

	// Convert to slice and sort by last message time
	threadList := make([]*ChatThread, 0, len(threads))
	for _, thread := range threads {
		threadList = append(threadList, thread)
	}

	sort.Slice(threadList, func(i, j int) bool {
		if threadList[i].LastMessage == nil {
			return false
		}
		if threadList[j].LastMessage == nil {
			return true
		}
		return threadList[i].LastMessage.CreatedAt.After(threadList[j].LastMessage.CreatedAt)
	})

	c.JSON(http.StatusOK, gin.H{"chats": threadList})
}

// GET /api/chats/:appointmentId - Get chat messages
func (h *ChatHandler) GetMessages(c *gin.Context) {
	appointmentID, err := uuid.Parse(c.Param("appointmentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	var userID uuid.UUID
	if exists && userIDStr != nil {
		userID, _ = uuid.Parse(userIDStr.(string))
	}

	// Verify appointment exists
	appointment, appointmentExists := h.storage.Appointments[appointmentID]
	if !appointmentExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	// Verify user is part of this appointment
	if exists && userIDStr != nil {
		if appointment.ClientID != userID && appointment.BarberID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this chat"})
			return
		}
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	// Collect messages for this appointment
	messages := make([]*models.ChatMessage, 0)
	for _, message := range h.storage.ChatMessages {
		if message.AppointmentID == appointmentID {
			messages = append(messages, message)
		}
	}

	// Sort by creation time ascending
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].CreatedAt.Before(messages[j].CreatedAt)
	})

	// Paginate
	total := len(messages)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"messages":   messages[start:end],
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + limit - 1) / limit,
	})
}

// POST /api/chats/:appointmentId - Send message
func (h *ChatHandler) SendMessage(c *gin.Context) {
	appointmentID, err := uuid.Parse(c.Param("appointmentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	senderID, _ := uuid.Parse(userIDStr.(string))

	// Verify appointment exists
	appointment, appointmentExists := h.storage.Appointments[appointmentID]
	if !appointmentExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	// Verify user is part of this appointment
	if appointment.ClientID != senderID && appointment.BarberID != senderID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to send messages in this chat"})
		return
	}

	// Determine receiver
	var receiverID uuid.UUID
	if appointment.ClientID == senderID {
		receiverID = appointment.BarberID
	} else {
		receiverID = appointment.ClientID
	}

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := &models.ChatMessage{
		ID:            uuid.New(),
		AppointmentID: appointmentID,
		SenderID:      senderID,
		ReceiverID:    receiverID,
		Content:       req.Content,
		CreatedAt:     time.Now(),
	}

	h.storage.ChatMessages[message.ID] = message

	c.JSON(http.StatusCreated, message)
}

// PUT /api/chats/:appointmentId/read - Mark messages as read
func (h *ChatHandler) MarkAsRead(c *gin.Context) {
	appointmentID, err := uuid.Parse(c.Param("appointmentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	now := time.Now()
	readCount := 0

	for _, message := range h.storage.ChatMessages {
		if message.AppointmentID == appointmentID &&
			message.ReceiverID == userID &&
			message.ReadAt == nil {
			message.ReadAt = &now
			readCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Messages marked as read",
		"readCount": readCount,
	})
}

// GET /api/chats/unread - Get unread message count
func (h *ChatHandler) GetUnreadCount(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := uuid.Parse(userIDStr.(string))

	unreadCount := 0
	for _, message := range h.storage.ChatMessages {
		if message.ReceiverID == userID && message.ReadAt == nil {
			unreadCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": unreadCount})
}
