import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Review Mutations
 */

// Submit a review
export const submitReview = mutation({
  args: {
    appointmentId: v.id("appointments"),
    rating: v.number(),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
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

    // Get appointment
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify user is the client
    if (appointment.clientId !== user._id) {
      throw new Error("Not authorized to review this appointment");
    }

    // Check if already reviewed
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (existingReview) {
      throw new Error("Appointment already reviewed");
    }

    // Create review
    const review = await ctx.db.insert("reviews", {
      appointmentId: args.appointmentId,
      clientId: user._id,
      barberId: appointment.barberId,
      rating: args.rating,
      comment: args.comment,
      photos: args.photos,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update appointment
    await ctx.db.patch(args.appointmentId, {
      hasReview: true,
      updatedAt: Date.now(),
    });

    // Update barber's average rating
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", appointment.barberId))
      .first();

    if (barberProfile) {
      const allReviews = await ctx.db
        .query("reviews")
        .withIndex("by_barber", (q) => q.eq("barberId", appointment.barberId))
        .collect();

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await ctx.db.patch(barberProfile._id, {
        averageRating,
        reviewCount: allReviews.length,
        updatedAt: Date.now(),
      });
    }

    return review;
  },
});

// Respond to review (for barbers)
export const respondToReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    response: v.string(),
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

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Verify this is the barber's review
    if (review.barberId !== user._id) {
      throw new Error("Not authorized to respond to this review");
    }

    await ctx.db.patch(args.reviewId, {
      barberResponse: args.response,
      barberRespondedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.reviewId);
  },
});

// Report review
export const reportReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await ctx.db.patch(args.reviewId, {
      isReported: true,
      reportReason: args.reason,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.reviewId);
  },
});
