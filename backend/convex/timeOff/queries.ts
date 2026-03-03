import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Time Off Queries
 */

/**
 * Get all time off blocks for the currently authenticated barber.
 * Optionally filter to blocks that overlap a given date range.
 */
export const getMyTimeOffBlocks = query({
  args: {
    fromDate: v.optional(v.string()), // "YYYY-MM-DD" — filter start (inclusive)
    toDate: v.optional(v.string()),   // "YYYY-MM-DD" — filter end (inclusive)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "barber") return [];

    let blocks = await ctx.db
      .query("timeOffBlocks")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .collect();

    // Optional date-range filter: keep blocks that overlap [fromDate, toDate]
    if (args.fromDate || args.toDate) {
      blocks = blocks.filter((b) => {
        if (args.toDate && b.startDate > args.toDate) return false;
        if (args.fromDate && b.endDate < args.fromDate) return false;
        return true;
      });
    }

    return blocks.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
});

/**
 * Check if a barber is blocked (time off) on a specific date+time.
 * Used by the availability query to exclude blocked slots.
 */
export const isBarberBlockedAt = query({
  args: {
    barberId: v.id("users"),
    date: v.string(),      // "YYYY-MM-DD"
    time: v.optional(v.string()), // "HH:mm" — omit to check full-day blocks only
  },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("timeOffBlocks")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .collect();

    for (const block of blocks) {
      // Check date range overlap
      if (args.date < block.startDate || args.date > block.endDate) continue;

      // Full-day block
      if (!block.startTime || !block.endTime) return true;

      // Partial-day block — check time overlap if a time was provided
      if (args.time) {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        const queryTime = timeToMinutes(args.time);
        if (queryTime >= blockStart && queryTime < blockEnd) return true;
      }
    }

    return false;
  },
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
