import { query } from "../_generated/server";
import { v } from "convex/values";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Review Queries
 */

// Get reviews for a barber
export const getBarberReviews = query({
  args: {
    barberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .collect();

    // Enrich with client details
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const client = await ctx.db.get(review.clientId);
        return {
          ...review,
          client: {
            name: client?.name,
            avatar: client?.avatar,
          },
        };
      })
    );

    return enrichedReviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get review by appointment
export const getReviewByAppointment = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();
  },
});

// Get my reviews (as a client)
export const getMyReviews = query({
  args: {},
  handler: async (ctx) => {
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

    return await ctx.db
      .query("reviews")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .collect();
  },
});

// Get barber rating summary (average rating and count)
export const getBarberRatingSummary = query({
  args: {
    barberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.barberId))
      .first();

    if (!barberProfile) {
      throw new Error("Barber profile not found");
    }

    return {
      averageRating: barberProfile.averageRating ?? 0,
      reviewCount: barberProfile.reviewCount ?? 0,
    };
  },
});
