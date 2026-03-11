import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getIdentityOrDev } from "../lib/authIdentity";

const PLATFORM_FEE_RATE = 0.15; // 15%

/**
 * Get the current barber's authenticated user record.
 * Throws if not authenticated or not a barber.
 */
async function getAuthenticatedBarber(ctx: any) {
  const identity = await getIdentityOrDev(ctx);
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email ?? ""))
    .first();

  if (!user) throw new ConvexError("User not found");
  if (user.role !== "barber") throw new ConvexError("Access denied: barbers only");

  return user;
}

/**
 * Get dashboard stats for the authenticated barber.
 *
 * Returns:
 *  - todayAppointments: list of today's appointments (non-cancelled/no_show)
 *  - upcomingCount: count of future confirmed/pending appointments
 *  - completedThisWeek: count of completed appointments this week
 *  - weeklyEarningsData: per-day earnings for this week (Mon–Sun)
 *  - weeklyEarningsTotal: total net earnings this week (in cents)
 *  - totalReviews: barber profile reviewCount
 *  - averageRating: barber profile averageRating
 *  - isAvailable: current availability toggle state
 *  - pendingCount: appointments awaiting confirmation
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedBarber(ctx);

    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!barberProfile) throw new ConvexError("Barber profile not found");

    const now = Date.now();

    // UTC start/end of today
    const todayDate = new Date(now);
    const startOfToday = Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth(),
      todayDate.getUTCDate(),
      0, 0, 0, 0
    );
    const endOfToday = Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth(),
      todayDate.getUTCDate(),
      23, 59, 59, 999
    );

    // UTC start of this week (Monday)
    const dayOfWeek = todayDate.getUTCDay(); // 0=Sun, 1=Mon, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth(),
      todayDate.getUTCDate() - daysFromMonday,
      0, 0, 0, 0
    );
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    // Fetch all of this barber's appointments
    const allAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_barber", (q: any) => q.eq("barberId", user._id))
      .collect();

    // Today's appointments (non-cancelled, non-no_show)
    const todayAppointments = allAppointments.filter(
      (apt: any) =>
        apt.scheduledFor >= startOfToday &&
        apt.scheduledFor <= endOfToday &&
        apt.status !== "cancelled" &&
        apt.status !== "no_show"
    );

    // Enrich today's appointments with client names
    const enrichedTodayAppointments = await Promise.all(
      todayAppointments
        .sort((a: any, b: any) => a.scheduledFor - b.scheduledFor)
        .map(async (apt: any) => {
          const client = await ctx.db.get(apt.clientId as Id<"users">);
          return {
            _id: apt._id,
            scheduledFor: apt.scheduledFor,
            serviceName: apt.serviceName,
            duration: apt.duration,
            price: apt.price,
            status: apt.status,
            locationType: apt.locationType,
            clientName: client?.name ?? "Unknown",
            clientAvatar: client?.avatar,
          };
        })
    );

    // Upcoming appointments count (future, pending or confirmed)
    const upcomingCount = allAppointments.filter(
      (apt: any) =>
        apt.scheduledFor > now &&
        (apt.status === "pending" || apt.status === "confirmed")
    ).length;

    // Pending (unconfirmed) count
    const pendingCount = allAppointments.filter(
      (apt: any) => apt.status === "pending"
    ).length;

    // Completed this week
    const completedThisWeek = allAppointments.filter(
      (apt: any) =>
        apt.scheduledFor >= startOfWeek &&
        apt.scheduledFor <= endOfWeek &&
        apt.status === "completed"
    ).length;

    // Weekly earnings data from receipts (paid, this week, this barber)
    // Group by day of week Mon(0)…Sun(6)
    const weeklyReceipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q: any) => q.eq("barberId", user._id))
      .collect();

    const paidWeeklyReceipts = weeklyReceipts.filter(
      (r: any) =>
        r.status === "paid" &&
        r.paidAt !== undefined &&
        r.paidAt >= startOfWeek &&
        r.paidAt <= endOfWeek
    );

    // Build Mon–Sun buckets
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyEarnings: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const receipt of paidWeeklyReceipts) {
      const receiptDate = new Date(receipt.paidAt!);
      const rDayOfWeek = receiptDate.getUTCDay(); // 0=Sun
      const bucketIndex = rDayOfWeek === 0 ? 6 : rDayOfWeek - 1; // Mon=0 … Sun=6
      // Net earnings = total minus platform fee
      const net = Math.round(receipt.total * (1 - PLATFORM_FEE_RATE));
      dailyEarnings[bucketIndex] += net;
    }

    const weeklyEarningsData = DAY_LABELS.map((label, i) => ({
      label,
      value: dailyEarnings[i],
    }));

    const weeklyEarningsTotal = dailyEarnings.reduce((sum, v) => sum + v, 0);

    return {
      todayAppointments: enrichedTodayAppointments,
      todayCount: enrichedTodayAppointments.length,
      upcomingCount,
      pendingCount,
      completedThisWeek,
      weeklyEarningsData,
      weeklyEarningsTotal,
      averageRating: barberProfile.averageRating ?? 0,
      totalReviews: barberProfile.reviewCount ?? 0,
      isAvailable: barberProfile.isAvailable,
    };
  },
});

/**
 * Toggle the barber's availability status.
 */
export const toggleAvailability = mutation({
  args: {
    isAvailable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedBarber(ctx);

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!profile) throw new ConvexError("Barber profile not found");

    await ctx.db.patch(profile._id, {
      isAvailable: args.isAvailable,
      updatedAt: Date.now(),
    });

    return { isAvailable: args.isAvailable };
  },
});
