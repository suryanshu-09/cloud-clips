package main

import (
	"log"
	"net/http"
	"os"

	"cloud-clips/internal/graphql"
	"cloud-clips/internal/handlers"
	"cloud-clips/internal/middleware"
	"cloud-clips/internal/storage"

	"github.com/gin-gonic/gin"
	gqlHandler "github.com/graphql-go/handler"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Determine environment
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize storage
	// TODO Phase 22: Switch to PostgreSQL storage when complete
	// To use PostgreSQL: Set DATABASE_URL in .env and complete postgres.go implementation
	store := storage.NewMemoryStorage()
	store.SeedMockData()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(store)
	userHandler := handlers.NewUserHandler(store)
	barberHandler := handlers.NewBarberHandler(store)
	appointmentHandler := handlers.NewAppointmentHandler(store)
	productHandler := handlers.NewProductHandler(store)
	orderHandler := handlers.NewOrderHandler(store)
	couponHandler := handlers.NewCouponHandler(store)
	chatHandler := handlers.NewChatHandler(store)
	notificationHandler := handlers.NewNotificationHandler(store)
	paymentHandler := handlers.NewPaymentHandler(store)

	// Initialize Gin router
	router := gin.New()

	// Global middleware
	router.Use(middleware.RecoveryMiddleware())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.RateLimitMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Cloud Clips API is running",
		})
	})

	// GraphQL endpoint (legacy support)
	schema, err := graphql.NewSchema(store)
	if err != nil {
		log.Fatal("Failed to create GraphQL schema:", err)
	}
	log.Printf("GraphQL Schema created successfully with %d query fields", len(schema.QueryType().Fields()))

	graphqlHandler := gqlHandler.New(&gqlHandler.Config{
		Schema:     &schema,
		Pretty:     true,
		GraphiQL:   true,
		Playground: true,
	})

	router.Any("/graphql", gin.WrapH(graphqlHandler))

	// REST API routes
	api := router.Group("/api")
	{
		// ================== AUTH ROUTES ==================
		auth := api.Group("/auth")
		auth.Use(middleware.AuthRateLimitMiddleware())
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot", authHandler.ForgotPassword)
			auth.POST("/reset", authHandler.ResetPassword)
			auth.GET("/verify", authHandler.VerifyEmail)
			auth.POST("/firebase-sync", authHandler.FirebaseSync)
		}

		// Auth-protected auth routes
		authProtected := api.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware())
		{
			authProtected.GET("/me", authHandler.GetCurrentUser)
		}

		// ================== USER ROUTES ==================
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware())
		{
			users.GET("", userHandler.GetUsers)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.PUT("/:id/avatar", userHandler.UpdateAvatar)
			users.GET("/:id/notifications", userHandler.GetNotificationSettings)
			users.PUT("/:id/notifications", userHandler.UpdateNotificationSettings)
		}

		// ================== BARBER ROUTES ==================
		// Public barber routes
		barbers := api.Group("/barbers")
		{
			barbers.GET("", barberHandler.GetBarbers)
			barbers.GET("/nearby", barberHandler.GetNearbyBarbers)
			barbers.GET("/profiles", barberHandler.GetBarberProfiles)
			barbers.GET("/:id", barberHandler.GetBarberProfile)
			barbers.GET("/:id/services", barberHandler.GetBarberServices)
			barbers.GET("/:id/reviews", barberHandler.GetBarberReviews)
			barbers.GET("/:id/availability", barberHandler.GetBarberAvailability)
		}

		// Protected barber routes (barber-only)
		barbersProtected := api.Group("/barbers")
		barbersProtected.Use(middleware.AuthMiddleware())
		barbersProtected.Use(middleware.RoleMiddleware("barber", "admin"))
		{
			barbersProtected.POST("", barberHandler.CreateBarberProfile)
			barbersProtected.PUT("/:id", barberHandler.UpdateBarberProfile)
			barbersProtected.PUT("/:id/schedule", barberHandler.UpdateBarberSchedule)
			barbersProtected.POST("/:id/services", barberHandler.UpdateBarberServices)
			barbersProtected.POST("/:id/gallery", barberHandler.AddGalleryImage)
			barbersProtected.DELETE("/:id/gallery/:imageIndex", barberHandler.DeleteGalleryImage)
			barbersProtected.DELETE("/:id", barberHandler.DeleteBarberProfile)
		}

		// ================== APPOINTMENT ROUTES ==================
		appointments := api.Group("/appointments")
		appointments.Use(middleware.OptionalAuthMiddleware())
		{
			appointments.GET("", appointmentHandler.GetAppointments)
			appointments.GET("/:id", appointmentHandler.GetAppointment)
		}

		appointmentsProtected := api.Group("/appointments")
		appointmentsProtected.Use(middleware.AuthMiddleware())
		{
			appointmentsProtected.POST("", appointmentHandler.CreateAppointment)
			appointmentsProtected.PUT("/:id", appointmentHandler.UpdateAppointment)
			appointmentsProtected.DELETE("/:id", appointmentHandler.DeleteAppointment)
			appointmentsProtected.POST("/:id/confirm", appointmentHandler.ConfirmAppointment)
			appointmentsProtected.POST("/:id/complete", appointmentHandler.CompleteAppointment)
			appointmentsProtected.POST("/:id/review", appointmentHandler.SubmitReview)
		}

		// ================== PRODUCT ROUTES ==================
		products := api.Group("/products")
		{
			products.GET("", productHandler.GetProducts)
			products.GET("/categories", productHandler.GetCategories)
			products.GET("/:id", productHandler.GetProduct)
		}

		productsProtected := api.Group("/products")
		productsProtected.Use(middleware.AuthMiddleware())
		productsProtected.Use(middleware.RoleMiddleware("barber", "admin"))
		{
			productsProtected.POST("", productHandler.CreateProduct)
			productsProtected.PUT("/:id", productHandler.UpdateProduct)
			productsProtected.DELETE("/:id", productHandler.DeleteProduct)
			productsProtected.PUT("/:id/stock", productHandler.UpdateStock)
		}

		// ================== ORDER ROUTES ==================
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.GET("", orderHandler.GetOrders)
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			orders.POST("/:id/cancel", orderHandler.CancelOrder)
		}

		// ================== COUPON ROUTES ==================
		coupons := api.Group("/coupons")
		{
			coupons.GET("", couponHandler.GetCoupons)
			coupons.GET("/:code", couponHandler.GetCouponByCode)
			coupons.POST("/validate", couponHandler.ValidateCoupon)
		}

		couponsProtected := api.Group("/coupons")
		couponsProtected.Use(middleware.AuthMiddleware())
		couponsProtected.Use(middleware.RoleMiddleware("barber", "admin"))
		{
			couponsProtected.POST("", couponHandler.CreateCoupon)
			couponsProtected.PUT("/:id", couponHandler.UpdateCoupon)
			couponsProtected.DELETE("/:id", couponHandler.DeleteCoupon)
		}

		// ================== CHAT ROUTES ==================
		chats := api.Group("/chats")
		chats.Use(middleware.AuthMiddleware())
		{
			chats.GET("", chatHandler.GetChats)
			chats.GET("/unread", chatHandler.GetUnreadCount)
			chats.GET("/:appointmentId", chatHandler.GetMessages)
			chats.POST("/:appointmentId", chatHandler.SendMessage)
			chats.PUT("/:appointmentId/read", chatHandler.MarkAsRead)
		}

		// ================== NOTIFICATION ROUTES ==================
		notifications := api.Group("/notifications")
		notifications.Use(middleware.AuthMiddleware())
		{
			notifications.GET("", notificationHandler.GetNotifications)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
			notifications.PUT("/read-all", notificationHandler.MarkAllAsRead)
			notifications.DELETE("/:id", notificationHandler.DeleteNotification)
			notifications.POST("/token", notificationHandler.RegisterToken)
		}

		// Admin-only notification creation
		notificationsAdmin := api.Group("/notifications")
		notificationsAdmin.Use(middleware.AuthMiddleware())
		notificationsAdmin.Use(middleware.RoleMiddleware("admin"))
		{
			notificationsAdmin.POST("", notificationHandler.CreateNotification)
		}

		// ================== PAYMENT ROUTES ==================
		payments := api.Group("/payments")
		payments.Use(middleware.AuthMiddleware())
		{
			payments.POST("/intent", paymentHandler.CreatePaymentIntent)
			payments.GET("/methods", paymentHandler.GetPaymentMethods)
			payments.POST("/methods", paymentHandler.SavePaymentMethod)
			payments.DELETE("/methods/:id", paymentHandler.DeletePaymentMethod)
			payments.PUT("/methods/:id/default", paymentHandler.SetDefaultPaymentMethod)
			payments.POST("/refund", paymentHandler.RefundPayment)
			payments.GET("/history", paymentHandler.GetPaymentHistory)
		}

		// Stripe webhook (no auth required - uses signature verification)
		api.POST("/webhooks/stripe", paymentHandler.HandleStripeWebhook)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("REST API: http://localhost:%s/api", port)
	log.Printf("GraphQL Playground: http://localhost:%s/graphql", port)
	log.Printf("Health Check: http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
