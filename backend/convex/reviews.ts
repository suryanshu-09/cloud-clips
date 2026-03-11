import { MutationCtx, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";

/**
 * Helper function to calculate and update a barber's average rating
 * Call this after submitting, updating, or deleting a review
 * 
 * @param ctx - Convex mutation context
 * @param barberId - The ID of the barber whose rating needs to be updated
 * @returns Object containing the new average rating and review count
 */
export async function calculateAverageRating(
  ctx: MutationCtx,
  barberId: Id<"users">
): Promise<{ averageRating: number; reviewCount: number }> {
  // Get all reviews for this barber
  const allReviews = await ctx.db
    .query("reviews")
    .withIndex("by_barber", (q) => q.eq("barberId", barberId))
    .collect();

  const reviewCount = allReviews.length;
  
  // Calculate average rating
  let averageRating = 0;
  if (reviewCount > 0) {
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = totalRating / reviewCount;
    // Round to 2 decimal places for consistency
    averageRating = Math.round(averageRating * 100) / 100;
  }

  // Find and update the barber's profile
  const barberProfile = await ctx.db
    .query("barberProfiles")
    .withIndex("by_user", (q) => q.eq("userId", barberId))
    .first();

  if (barberProfile) {
    await ctx.db.patch(barberProfile._id, {
      averageRating,
      reviewCount,
      updatedAt: Date.now(),
    });
  }

  return { averageRating, reviewCount };
}

/**
 * Get reviews for a specific barber with pagination support
 * Returns reviews sorted by creation date (newest first)
 * Enriches reviews with client details
 *
 * @param barberId - The ID of the barber to fetch reviews for
 * @param cursor - Optional cursor for pagination (review _id)
 * @param limit - Number of reviews to return per page (default: 10, max: 50)
 * @returns Paginated list of reviews with client details and next cursor
 */
export const getReviewsByBarber = query({
  args: {
    barberId: v.id("users"),
    cursor: v.optional(v.id("reviews")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate barberId exists
    const barber = await ctx.db.get(args.barberId);
    if (!barber) {
      throw new ConvexError("Barber not found");
    }

    // Validate and normalize limit
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);

    // Build query with index on barberId and sort by creation date
    let reviewsQuery = ctx.db
      .query("reviews")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId));

    // Apply cursor if provided
    if (args.cursor) {
      const cursorReview = await ctx.db.get(args.cursor);
      if (cursorReview) {
        reviewsQuery = reviewsQuery.filter((q) =>
          q.lt(q.field("createdAt"), cursorReview.createdAt)
        );
      }
    }

    // Fetch reviews with limit + 1 to check if there are more results
    const reviews = await reviewsQuery
      .order("desc")
      .take(limit + 1);

    // Determine if there are more results
    const hasMore = reviews.length > limit;
    const paginatedReviews = hasMore ? reviews.slice(0, limit) : reviews;

    // Enrich reviews with client details
    const enrichedReviews = await Promise.all(
      paginatedReviews.map(async (review) => {
        const client = await ctx.db.get(review.clientId);
        return {
          _id: review._id,
          appointmentId: review.appointmentId,
          clientId: review.clientId,
          barberId: review.barberId,
          rating: review.rating,
          comment: review.comment,
          photos: review.photos,
          barberResponse: review.barberResponse,
          barberRespondedAt: review.barberRespondedAt,
          isReported: review.isReported,
          reportReason: review.reportReason,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          client: {
            name: client?.name,
            avatar: client?.avatar,
          },
        };
      })
    );

    // Return paginated results
    return {
      reviews: enrichedReviews,
      nextCursor: hasMore ? paginatedReviews[paginatedReviews.length - 1]._id : undefined,
      hasMore,
    };
  },
});
