import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already a barber
    const existingProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingProfile) {
      throw new Error("Barber profile already exists");
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
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Barber profile not found");
    }

    await ctx.db.patch(profile._id, {
      ...args,
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
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Barber profile not found");
    }

    await ctx.db.patch(profile._id, {
      workingHours: args.workingHours,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});
