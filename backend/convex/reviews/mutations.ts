import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { calculateAverageRating } from "../reviews";
import { getIdentityOrDev } from "../lib/authIdentity";

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
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
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

    // Verify appointment is completed
    if (appointment.status !== "completed") {
      throw new ConvexError("Reviews can only be submitted for completed appointments");
    }

    // Validate rating (1-5 stars)
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError("Rating must be between 1 and 5 stars");
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

    // Update barber's average rating using helper function
    await calculateAverageRating(ctx, appointment.barberId);

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
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
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

// Report review for moderation
export const reportReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Prevent users from reporting their own reviews
    if (review.clientId === user._id) {
      throw new ConvexError("Cannot report your own review");
    }

    // Check if user already reported this review
    const existingReport = await ctx.db
      .query("reviewReports")
      .withIndex("by_review_reporter", (q) =>
        q.eq("reviewId", args.reviewId).eq("reporterId", user._id)
      )
      .first();

    if (existingReport) {
      throw new ConvexError("You have already reported this review");
    }

    // Create the report record
    await ctx.db.insert("reviewReports", {
      reviewId: args.reviewId,
      reporterId: user._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    // Update the review to mark it as reported
    const currentReportCount = review.reportCount || 0;
    await ctx.db.patch(args.reviewId, {
      isReported: true,
      reportReason: args.reason,
      reportCount: currentReportCount + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.reviewId);
  },
});
