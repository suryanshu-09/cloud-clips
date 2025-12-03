package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types for WebSocket communication
const (
	MessageTypeChat            = "chat"
	MessageTypeTyping          = "typing"
	MessageTypeAppointment     = "appointment"
	MessageTypeNotification    = "notification"
	MessageTypeConnectionState = "connection_state"
)

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Configure CORS - should be more restrictive in production
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate against allowed origins
		return true
	},
}

// Message represents a WebSocket message
type Message struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	From      string          `json:"from,omitempty"`
	To        string          `json:"to,omitempty"`
	Timestamp time.Time       `json:"timestamp"`
}

// ChatPayload represents a chat message payload
type ChatPayload struct {
	AppointmentID string `json:"appointmentId"`
	Content       string `json:"content"`
	MessageType   string `json:"messageType"`
	ImageURL      string `json:"imageUrl,omitempty"`
}

// TypingPayload represents a typing indicator payload
type TypingPayload struct {
	AppointmentID string `json:"appointmentId"`
	IsTyping      bool   `json:"isTyping"`
}

// AppointmentPayload represents an appointment update payload
type AppointmentPayload struct {
	AppointmentID string `json:"appointmentId"`
	Action        string `json:"action"` // confirmed, cancelled, completed, rescheduled
	NewTime       string `json:"newTime,omitempty"`
}

// NotificationPayload represents a notification payload
type NotificationPayload struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	Action string `json:"action,omitempty"`
	Data   any    `json:"data,omitempty"`
}

// Client represents a connected WebSocket client
type Client struct {
	ID       string
	UserID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
	mu       sync.Mutex
	isAlive  bool
	lastPing time.Time
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients mapped by user ID
	clients map[string][]*Client

	// Inbound messages from clients
	broadcast chan []byte

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mu sync.RWMutex

	// Stop signal
	stop chan struct{}
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string][]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		stop:       make(chan struct{}),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	log.Println("[WebSocket] Hub started")

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = append(h.clients[client.UserID], client)
			log.Printf("[WebSocket] Client registered: user=%s, total connections for user=%d",
				client.UserID, len(h.clients[client.UserID]))
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				for i, c := range clients {
					if c.ID == client.ID {
						// Remove client from slice
						h.clients[client.UserID] = append(clients[:i], clients[i+1:]...)
						break
					}
				}
				// Clean up if no more connections for this user
				if len(h.clients[client.UserID]) == 0 {
					delete(h.clients, client.UserID)
				}
				close(client.Send)
				log.Printf("[WebSocket] Client unregistered: user=%s, remaining connections=%d",
					client.UserID, len(h.clients[client.UserID]))
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, clients := range h.clients {
				for _, client := range clients {
					select {
					case client.Send <- message:
					default:
						// Client's send buffer is full, skip
						log.Printf("[WebSocket] Client send buffer full, skipping: user=%s", client.UserID)
					}
				}
			}
			h.mu.RUnlock()

		case <-h.stop:
			log.Println("[WebSocket] Hub stopping")
			h.mu.Lock()
			for _, clients := range h.clients {
				for _, client := range clients {
					close(client.Send)
				}
			}
			h.clients = make(map[string][]*Client)
			h.mu.Unlock()
			return
		}
	}
}

// Stop gracefully stops the hub
func (h *Hub) Stop() {
	close(h.stop)
}

// SendToUser sends a message to a specific user (all their connections)
func (h *Hub) SendToUser(userID string, message *Message) error {
	message.Timestamp = time.Now()
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.clients[userID]; ok {
		for _, client := range clients {
			select {
			case client.Send <- data:
			default:
				log.Printf("[WebSocket] Failed to send message to user=%s, buffer full", userID)
			}
		}
		return nil
	}

	log.Printf("[WebSocket] User not connected: %s", userID)
	return nil // Not an error if user is not connected
}

// SendToUsers sends a message to multiple users
func (h *Hub) SendToUsers(userIDs []string, message *Message) {
	for _, userID := range userIDs {
		h.SendToUser(userID, message)
	}
}

// Broadcast sends a message to all connected clients
func (h *Hub) Broadcast(message *Message) error {
	message.Timestamp = time.Now()
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.broadcast <- data
	return nil
}

// IsUserOnline checks if a user has any active connections
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, ok := h.clients[userID]
	return ok && len(clients) > 0
}

// GetOnlineUsers returns a list of online user IDs
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// GetConnectionCount returns the total number of active connections
func (h *Hub) GetConnectionCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	count := 0
	for _, clients := range h.clients {
		count += len(clients)
	}
	return count
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024) // 512KB max message size
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		c.mu.Lock()
		c.lastPing = time.Now()
		c.isAlive = true
		c.mu.Unlock()
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Read error: %v", err)
			}
			break
		}

		// Parse the message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[WebSocket] Invalid message format: %v", err)
			continue
		}

		msg.From = c.UserID
		msg.Timestamp = time.Now()

		// Handle different message types
		switch msg.Type {
		case MessageTypeChat, MessageTypeTyping:
			// Forward to recipient
			if msg.To != "" {
				c.Hub.SendToUser(msg.To, &msg)
			}
		default:
			log.Printf("[WebSocket] Unknown message type: %s", msg.Type)
		}
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// The hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current write
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs handles WebSocket requests from clients
func (h *Hub) ServeWs(w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade error: %v", err)
		return
	}

	// Generate unique client ID
	clientID := generateClientID()

	client := &Client{
		ID:       clientID,
		UserID:   userID,
		Hub:      h,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		isAlive:  true,
		lastPing: time.Now(),
	}

	client.Hub.register <- client

	// Send connection confirmation
	confirmMsg := &Message{
		Type:      MessageTypeConnectionState,
		Timestamp: time.Now(),
		Payload:   json.RawMessage(`{"status":"connected"}`),
	}
	data, _ := json.Marshal(confirmMsg)
	client.Send <- data

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405.000000000")
}

// Helper functions for common message patterns

// SendChatMessage sends a chat message to a user
func (h *Hub) SendChatMessage(toUserID string, payload ChatPayload, fromUserID string) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return h.SendToUser(toUserID, &Message{
		Type:    MessageTypeChat,
		Payload: payloadBytes,
		From:    fromUserID,
		To:      toUserID,
	})
}

// SendTypingIndicator sends a typing indicator to a user
func (h *Hub) SendTypingIndicator(toUserID string, appointmentID string, isTyping bool, fromUserID string) error {
	payload := TypingPayload{
		AppointmentID: appointmentID,
		IsTyping:      isTyping,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return h.SendToUser(toUserID, &Message{
		Type:    MessageTypeTyping,
		Payload: payloadBytes,
		From:    fromUserID,
		To:      toUserID,
	})
}

// SendAppointmentUpdate sends an appointment update to a user
func (h *Hub) SendAppointmentUpdate(toUserID string, payload AppointmentPayload, fromUserID string) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return h.SendToUser(toUserID, &Message{
		Type:    MessageTypeAppointment,
		Payload: payloadBytes,
		From:    fromUserID,
		To:      toUserID,
	})
}

// SendNotification sends a notification to a user
func (h *Hub) SendNotification(toUserID string, payload NotificationPayload) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return h.SendToUser(toUserID, &Message{
		Type:    MessageTypeNotification,
		Payload: payloadBytes,
		To:      toUserID,
	})
}
