import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Barber Mutations
 */

// Create barber profile
export const createBarberProfile = mutation({
  args: {
    businessName: v.string(),
    businessDescription: v.optional(v.string()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }),
    services: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      duration: v.number(),
      category: v.string(),
    })),
    specialties: v.optional(v.array(v.string())),
    workingHours: v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      isAvailable: v.boolean(),
    })),
    offersInHomeService: v.optional(v.boolean()),
    inHomeServiceRadius: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if user is already a barber
    const existingProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingProfile) {
      throw new ConvexError("Barber profile already exists");
    }

    // Update user role to barber
    await ctx.db.patch(user._id, {
      role: "barber",
      updatedAt: Date.now(),
    });

    // Create barber profile
    const profile = await ctx.db.insert("barberProfiles", {
      userId: user._id,
      businessName: args.businessName,
      businessDescription: args.businessDescription,
      location: args.location,
      services: args.services,
      specialties: args.specialties,
      workingHours: args.workingHours,
      offersInHomeService: args.offersInHomeService || false,
      inHomeServiceRadius: args.inHomeServiceRadius,
      timezone: args.timezone,
      isAvailable: true,
      isVerified: false,
      averageRating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return profile;
  },
});

// Update barber profile
export const updateBarberProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    })),
    services: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      duration: v.number(),
      category: v.string(),
    }))),
    specialties: v.optional(v.array(v.string())),
    workingHours: v.optional(v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      isAvailable: v.boolean(),
    }))),
    isAvailable: v.optional(v.boolean()),
    offersInHomeService: v.optional(v.boolean()),
    inHomeServiceRadius: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    // Role-based access control - only barbers can update their profile
    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber") {
      throw new ConvexError("Access denied: Only barbers can update barber profiles");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new ConvexError("Barber profile not found");
    }

    await ctx.db.patch(profile._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

/**
 * Update barber's Stripe Connect account ID
 * Called during Stripe Connect onboarding
 */
export const updateStripeAccount = mutation({
  args: {
    userId: v.id("users"),
    stripeAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user performing the update
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Only allow users to update their own stripe account, or admin users
    if (currentUser._id !== args.userId && currentUser.role !== "admin") {
      throw new ConvexError("Not authorized to update this barber's Stripe account");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new ConvexError("Barber profile not found");
    }

    await ctx.db.patch(profile._id, {
      stripeAccountId: args.stripeAccountId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update working hours
export const updateWorkingHours = mutation({
  args: {
    workingHours: v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      isAvailable: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    // Role-based access control - only barbers can update working hours
    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber") {
      throw new ConvexError("Access denied: Only barbers can update working hours");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new ConvexError("Barber profile not found");
    }

    await ctx.db.patch(profile._id, {
      workingHours: args.workingHours,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});
