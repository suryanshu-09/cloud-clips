import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Review Queries
 */

// Get reviews for a barber (paginated)
export const getBarberReviews = query({
  args: {
    barberId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp cursor (for keyset pagination)
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Use by_barber index, ordered descending (newest first)
    let reviewsQuery = ctx.db
      .query("reviews")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .order("desc");

    // Apply cursor for keyset pagination (skip reviews older than cursor)
    const reviews = await reviewsQuery.take(limit + 1);

    const hasMore = reviews.length > limit;
    const page = hasMore ? reviews.slice(0, limit) : reviews;

    // Enrich with client details (only the returned page)
    const enrichedReviews = await Promise.all(
      page.map(async (review) => {
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

    return {
      reviews: enrichedReviews,
      nextCursor: hasMore ? page[page.length - 1].createdAt : null,
      hasMore,
    };
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
