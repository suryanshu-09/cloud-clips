import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Cloud Clips Database Schema
 * 
 * Tables:
 * - users: Core user accounts with roles (client/barber/admin)
 * - barberProfiles: Extended profile for barbers with business info
 * - appointments: Booking records between clients and barbers
 * - reviews: Ratings and reviews for barbers
 * - messages: Chat messages between users
 * - products: Marketplace products sold by barbers
 * - orders: Product purchase orders
 * - coupons: Promotion codes
 * - conversations: Chat conversation metadata
 */

export default defineSchema({
  // Core user table with Convex Auth
  users: defineTable({
    // Auth fields (managed by Convex Auth)
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    
    // Profile fields
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()), // URL to stored image
    
    // Role-based access
    role: v.union(
      v.literal("client"),
      v.literal("barber"),
      v.literal("admin")
    ),
    
    // Account status
    isActive: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // For push notifications
    pushTokens: v.optional(v.array(v.string())),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),

  // Extended profile for barbers
  barberProfiles: defineTable({
    userId: v.id("users"),
    
    // Business info
    businessName: v.string(),
    businessDescription: v.optional(v.string()),
    
    // Location (for map discovery)
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }),
    
    // Services offered
    services: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      duration: v.number(), // in minutes
      category: v.string(),
    })),
    
    // Specialties
    specialties: v.optional(v.array(v.string())),
    
    // Working hours
    workingHours: v.array(v.object({
      dayOfWeek: v.number(), // 0-6 (Sun-Sat)
      startTime: v.string(), // "HH:mm" format
      endTime: v.string(),   // "HH:mm" format
      isAvailable: v.boolean(),
    })),
    
    // Rating stats
    averageRating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    
    // Portfolio images
    portfolioImages: v.optional(v.array(v.string())),
    
    // Availability toggle
    isAvailable: v.boolean(),
    
    // Verification status
    isVerified: v.boolean(),
    
    // Stripe Connect account ID
    stripeAccountId: v.optional(v.string()),
    
    // In-home service availability
    offersInHomeService: v.boolean(),
    inHomeServiceRadius: v.optional(v.number()), // in miles
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_location", ["location.lat", "location.lng"])
    .index("by_rating", ["averageRating"])
    .index("by_verified", ["isVerified"])
    .index("by_available", ["isAvailable"]),

  // Appointments
  appointments: defineTable({
    clientId: v.id("users"),
    barberId: v.id("users"),
    
    // Service details
    serviceId: v.string(),
    serviceName: v.string(),
    price: v.number(),
    duration: v.number(), // in minutes
    
    // Scheduling
    scheduledFor: v.number(), // timestamp
    endTime: v.number(),      // calculated timestamp
    
    // Location type
    locationType: v.union(
      v.literal("in_salon"),
      v.literal("in_home")
    ),
    
    // Address (for in-home service)
    address: v.optional(v.string()),
    addressCoords: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    
    // Status lifecycle
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    
    // Special requests
    specialRequests: v.optional(v.string()),
    
    // Payment
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    paymentIntentId: v.optional(v.string()),
    
    // Review tracking
    hasReview: v.optional(v.boolean()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_barber", ["barberId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_barber_scheduled", ["barberId", "scheduledFor"])
    .index("by_client_scheduled", ["clientId", "scheduledFor"]),

  // Reviews
  reviews: defineTable({
    appointmentId: v.id("appointments"),
    clientId: v.id("users"),
    barberId: v.id("users"),
    
    // Rating
    rating: v.number(), // 1-5
    
    // Review content
    comment: v.optional(v.string()),
    
    // Photos
    photos: v.optional(v.array(v.string())),
    
    // Barber response
    barberResponse: v.optional(v.string()),
    barberRespondedAt: v.optional(v.number()),
    
    // Moderation
    isReported: v.optional(v.boolean()),
    reportReason: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_barber", ["barberId"])
    .index("by_client", ["clientId"])
    .index("by_appointment", ["appointmentId"])
    .index("by_rating", ["rating"]),

  // Conversations (for chat)
  conversations: defineTable({
    participants: v.array(v.id("users")),
    
    // Metadata
    appointmentId: v.optional(v.id("appointments")),
    
    // Last message preview
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessageSenderId: v.optional(v.id("users")),
    
    // Unread counts per user
    unreadCounts: v.optional(v.record(v.string(), v.number())),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_participants", ["participants"])
    .index("by_appointment", ["appointmentId"])
    .index("by_last_message", ["lastMessageAt"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    
    // Content
    content: v.string(),
    
    // Attachments
    attachments: v.optional(v.array(v.object({
      type: v.union(
        v.literal("image"),
        v.literal("file"),
        v.literal("voice")
      ),
      url: v.string(),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
    
    // Read status
    readBy: v.array(v.id("users")),
    
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_created", ["createdAt"])
    .index("by_conversation_created", ["conversationId", "createdAt"]),

  // Products (marketplace)
  products: defineTable({
    barberId: v.id("users"),
    
    // Product info
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    
    // Inventory
    stock: v.number(),
    
    // Images
    images: v.array(v.string()),
    
    // Category
    category: v.string(),
    subcategory: v.optional(v.string()),
    
    // Tags
    tags: v.optional(v.array(v.string())),
    
    // Rating
    averageRating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    
    // Status
    isActive: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_barber", ["barberId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_price", ["price"]),

  // Orders
  orders: defineTable({
    clientId: v.id("users"),
    barberId: v.id("users"),
    
    // Items
    items: v.array(v.object({
      productId: v.id("products"),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
    })),
    
    // Totals
    subtotal: v.number(),
    tax: v.optional(v.number()),
    shipping: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    
    // Shipping address
    shippingAddress: v.object({
      name: v.string(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      phone: v.optional(v.string()),
    }),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    
    // Payment
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    paymentIntentId: v.optional(v.string()),
    
    // Tracking
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    
    // Coupon
    couponCode: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_barber", ["barberId"])
    .index("by_status", ["status"])
    .index("by_payment", ["paymentStatus"]),

  // Coupons
  coupons: defineTable({
    // Creator
    createdBy: v.id("users"), // barber or admin
    
    // Coupon details
    code: v.string(),
    description: v.optional(v.string()),
    
    // Discount type
    discountType: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount")
    ),
    discountValue: v.number(), // percentage or dollar amount
    
    // Applicability
    applicableTo: v.union(
      v.literal("services"),
      v.literal("products"),
      v.literal("both")
    ),
    
    // Target barber (null = global)
    barberId: v.optional(v.id("users")),
    
    // Limits
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    
    // Dates
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
    
    // Usage tracking
    currentUses: v.number(),
    
    // Status
    isActive: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_barber", ["barberId"])
    .index("by_active", ["isActive"])
    .index("by_valid_dates", ["validFrom", "validUntil"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    
    // Content
    type: v.union(
      v.literal("appointment_confirmed"),
      v.literal("appointment_reminder"),
      v.literal("appointment_cancelled"),
      v.literal("new_message"),
      v.literal("new_review"),
      v.literal("payment_received"),
      v.literal("order_shipped"),
      v.literal("order_delivered"),
      v.literal("system_announcement")
    ),
    title: v.string(),
    body: v.string(),
    
    // Deep link
    data: v.optional(v.record(v.string(), v.string())),
    
    // Status
    isRead: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_created", ["createdAt"]),
});
