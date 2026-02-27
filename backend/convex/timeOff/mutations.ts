import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Time Off Mutations
 * Allows barbers to block specific date ranges on their schedule.
 */

// Validate "YYYY-MM-DD" format
function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Validate "HH:mm" format
function isValidTime(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Block a date range as time off.
 * Can be a full-day block (no startTime/endTime) or a partial-day block.
 */
export const blockTimeOff = mutation({
  args: {
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(),   // "YYYY-MM-DD"
    reason: v.optional(v.string()),
    startTime: v.optional(v.string()), // "HH:mm" — omit for full-day
    endTime: v.optional(v.string()),   // "HH:mm" — omit for full-day
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new ConvexError("User not found");
    if (user.role !== "barber") {
      throw new ConvexError("Access denied: Only barbers can manage time off");
    }

    // Validate dates
    if (!isValidDate(args.startDate)) {
      throw new ConvexError("Invalid startDate format. Use YYYY-MM-DD.");
    }
    if (!isValidDate(args.endDate)) {
      throw new ConvexError("Invalid endDate format. Use YYYY-MM-DD.");
    }
    if (args.startDate > args.endDate) {
      throw new ConvexError("startDate must be on or before endDate.");
    }

    // Validate optional time range
    if (args.startTime !== undefined || args.endTime !== undefined) {
      if (!args.startTime || !args.endTime) {
        throw new ConvexError(
          "Both startTime and endTime must be provided for a partial-day block."
        );
      }
      if (!isValidTime(args.startTime)) {
        throw new ConvexError("Invalid startTime format. Use HH:mm.");
      }
      if (!isValidTime(args.endTime)) {
        throw new ConvexError("Invalid endTime format. Use HH:mm.");
      }
      if (timeToMinutes(args.endTime) <= timeToMinutes(args.startTime)) {
        throw new ConvexError("endTime must be after startTime.");
      }
      // Partial-day blocks must be single-day
      if (args.startDate !== args.endDate) {
        throw new ConvexError(
          "Partial-day blocks (with startTime/endTime) must be single-day (startDate === endDate)."
        );
      }
    }

    const id = await ctx.db.insert("timeOffBlocks", {
      barberId: user._id,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      startTime: args.startTime,
      endTime: args.endTime,
      createdAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete (unblock) a time off entry.
 */
export const deleteTimeOffBlock = mutation({
  args: {
    blockId: v.id("timeOffBlocks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new ConvexError("User not found");
    if (user.role !== "barber") {
      throw new ConvexError("Access denied: Only barbers can manage time off");
    }

    const block = await ctx.db.get(args.blockId);
    if (!block) throw new ConvexError("Time off block not found");
    if (block.barberId !== user._id) {
      throw new ConvexError("Not authorized to delete this time off block");
    }

    await ctx.db.delete(args.blockId);
    return { success: true };
  },
});
