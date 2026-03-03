import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Admin Analytics Queries
 *
 * Provides aggregated statistics for the admin dashboard:
 * - Booking statistics (total, by status, by period)
 * - Revenue charts (daily/weekly/monthly breakdown)
 * - User growth (new users over time)
 * - Popular services (most booked services)
 */

// Helper: assert the caller is an admin
async function assertAdmin(ctx: { auth: { getUserIdentity: () => Promise<{ email?: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user || user.role !== "admin") {
    throw new ConvexError("Admin access required");
  }
  return user;
}

// Helper: get start-of-day timestamp (UTC) N days ago
function daysAgo(n: number): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.getTime();
}

// Helper: format a timestamp as "YYYY-MM-DD"
function toDateLabel(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// Helper: format a timestamp as "Mon DD" (short)
function toShortDateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Helper: get month label "Jan 2024"
function toMonthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * getBookingStatistics
 *
 * Returns aggregate booking counts broken down by status and a
 * daily time-series for the selected period.
 *
 * period: "7d" | "30d" | "90d"
 */
export const getBookingStatistics = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const days = args.period === "7d" ? 7 : args.period === "30d" ? 30 : 90;
    const since = daysAgo(days);

    // Fetch all appointments in the window
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_scheduled", (q: any) => q.gte("scheduledFor", since))
      .collect();

    // Overall counts
    const totalBookings = appointments.length;
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };

    // Daily series: date label -> count
    const dailySeries: Record<string, number> = {};

    // Pre-fill all days in range so the chart has no gaps
    for (let i = days - 1; i >= 0; i--) {
      const ts = daysAgo(i);
      dailySeries[toDateLabel(ts)] = 0;
    }

    for (const apt of appointments) {
      statusCounts[apt.status] = (statusCounts[apt.status] ?? 0) + 1;

      const dateKey = toDateLabel(apt.scheduledFor);
      if (dateKey in dailySeries) {
        dailySeries[dateKey] += 1;
      }
    }

    // Convert to sorted array for charts
    const dailyData = Object.entries(dailySeries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        label:
          days === 7
            ? new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
            : toShortDateLabel(new Date(date).getTime()),
        date,
        count,
      }));

    // Completion rate
    const completionRate =
      totalBookings > 0
        ? Math.round((statusCounts.completed / totalBookings) * 100)
        : 0;

    // Cancellation rate
    const cancellationRate =
      totalBookings > 0
        ? Math.round(
            ((statusCounts.cancelled + statusCounts.no_show) / totalBookings) * 100
          )
        : 0;

    return {
      totalBookings,
      statusCounts,
      dailyData,
      completionRate,
      cancellationRate,
      period: args.period,
    };
  },
});

/**
 * getRevenueCharts
 *
 * Returns total revenue and a time-series broken down by day (7d/30d)
 * or by month (90d/all). Revenue is derived from completed appointments
 * and paid orders.
 *
 * period: "7d" | "30d" | "90d"
 */
export const getRevenueCharts = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const days = args.period === "7d" ? 7 : args.period === "30d" ? 30 : 90;
    const since = daysAgo(days);

    // Revenue from completed appointments
    const completedAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .filter((q: any) => q.gte(q.field("scheduledFor"), since))
      .collect();

    // Revenue from paid orders
    const paidOrders = await ctx.db
      .query("orders")
      .withIndex("by_payment", (q: any) => q.eq("paymentStatus", "paid"))
      .filter((q: any) => q.gte(q.field("createdAt"), since))
      .collect();

    // Build daily series
    const dailySeries: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const ts = daysAgo(i);
      dailySeries[toDateLabel(ts)] = 0;
    }

    let totalServiceRevenue = 0;
    let totalProductRevenue = 0;

    for (const apt of completedAppointments) {
      totalServiceRevenue += apt.price;
      const key = toDateLabel(apt.scheduledFor);
      if (key in dailySeries) {
        dailySeries[key] += apt.price;
      }
    }

    for (const order of paidOrders) {
      totalProductRevenue += order.total;
      const key = toDateLabel(order.createdAt);
      if (key in dailySeries) {
        dailySeries[key] += order.total;
      }
    }

    const totalRevenue = totalServiceRevenue + totalProductRevenue;

    // Convert to chart data
    const chartData = Object.entries(dailySeries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        label:
          days === 7
            ? new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
            : toShortDateLabel(new Date(date).getTime()),
        date,
        amount,
        // Amount in dollars (prices are stored in cents)
        amountDollars: amount / 100,
      }));

    // Platform revenue (15% fee)
    const platformRevenue = Math.round(totalRevenue * 0.15);

    return {
      totalRevenue,
      totalRevenueDollars: totalRevenue / 100,
      totalServiceRevenue,
      totalServiceRevenueDollars: totalServiceRevenue / 100,
      totalProductRevenue,
      totalProductRevenueDollars: totalProductRevenue / 100,
      platformRevenue,
      platformRevenueDollars: platformRevenue / 100,
      chartData,
      period: args.period,
    };
  },
});

/**
 * getUserGrowth
 *
 * Returns new user registrations over time, broken down by role
 * (client vs barber) and an overall daily/weekly series.
 *
 * period: "7d" | "30d" | "90d"
 */
export const getUserGrowth = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const days = args.period === "7d" ? 7 : args.period === "30d" ? 30 : 90;
    const since = daysAgo(days);

    // All users created in range
    const newUsers = await ctx.db
      .query("users")
      .filter((q: any) => q.gte(q.field("createdAt"), since))
      .collect();

    // Total counts by role
    const clientCount = newUsers.filter((u: any) => u.role === "client").length;
    const barberCount = newUsers.filter((u: any) => u.role === "barber").length;
    const adminCount = newUsers.filter((u: any) => u.role === "admin").length;

    // Daily series
    const clientSeries: Record<string, number> = {};
    const barberSeries: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const ts = daysAgo(i);
      const key = toDateLabel(ts);
      clientSeries[key] = 0;
      barberSeries[key] = 0;
    }

    for (const user of newUsers) {
      const key = toDateLabel(user.createdAt);
      if (user.role === "client" && key in clientSeries) {
        clientSeries[key] += 1;
      } else if (user.role === "barber" && key in barberSeries) {
        barberSeries[key] += 1;
      }
    }

    const chartData = Object.keys(clientSeries)
      .sort()
      .map((date) => ({
        label:
          days === 7
            ? new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
            : toShortDateLabel(new Date(date).getTime()),
        date,
        clients: clientSeries[date],
        barbers: barberSeries[date],
        total: clientSeries[date] + barberSeries[date],
      }));

    // All-time totals
    const allUsers = await ctx.db.query("users").collect();
    const allTimeTotal = allUsers.length;
    const allTimeClients = allUsers.filter((u: any) => u.role === "client").length;
    const allTimeBarbers = allUsers.filter((u: any) => u.role === "barber").length;

    // Active barbers (verified)
    const activeBarbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_verified", (q: any) => q.eq("isVerified", true))
      .collect();

    return {
      newUsersInPeriod: newUsers.length,
      newClientsInPeriod: clientCount,
      newBarbersInPeriod: barberCount,
      newAdminsInPeriod: adminCount,
      chartData,
      allTimeTotal,
      allTimeClients,
      allTimeBarbers,
      activeVerifiedBarbers: activeBarbers.length,
      period: args.period,
    };
  },
});

/**
 * getPopularServices
 *
 * Returns the most frequently booked services, ranked by booking count,
 * with revenue and average price information.
 *
 * period: "7d" | "30d" | "90d" | "all"
 */
export const getPopularServices = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("all")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const limit = args.limit ?? 10;
    let appointments;

    if (args.period === "all") {
      appointments = await ctx.db.query("appointments").collect();
    } else {
      const days = args.period === "7d" ? 7 : args.period === "30d" ? 30 : 90;
      const since = daysAgo(days);
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_scheduled", (q: any) => q.gte("scheduledFor", since))
        .collect();
    }

    // Aggregate by service name
    const serviceMap: Record<
      string,
      { name: string; bookingCount: number; totalRevenue: number; completedCount: number }
    > = {};

    for (const apt of appointments) {
      const name = apt.serviceName ?? "Unknown";
      if (!serviceMap[name]) {
        serviceMap[name] = {
          name,
          bookingCount: 0,
          totalRevenue: 0,
          completedCount: 0,
        };
      }
      serviceMap[name].bookingCount += 1;
      if (apt.status === "completed") {
        serviceMap[name].totalRevenue += apt.price;
        serviceMap[name].completedCount += 1;
      }
    }

    const ranked = Object.values(serviceMap)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, limit)
      .map((s) => ({
        ...s,
        avgPriceDollars: s.completedCount > 0 ? s.totalRevenue / s.completedCount / 100 : 0,
        totalRevenueDollars: s.totalRevenue / 100,
        completionRate:
          s.bookingCount > 0 ? Math.round((s.completedCount / s.bookingCount) * 100) : 0,
      }));

    const totalBookings = appointments.length;

    return {
      services: ranked,
      totalBookings,
      period: args.period,
    };
  },
});

/**
 * getAdminOverview
 *
 * A single combined query for the analytics dashboard overview panel —
 * returns key headline numbers without needing multiple round-trips.
 */
export const getAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);

    const now = Date.now();
    const thirtyDaysAgo = daysAgo(30);
    const sevenDaysAgo = daysAgo(7);

    // Counts
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const totalClients = allUsers.filter((u: any) => u.role === "client").length;
    const totalBarbers = allUsers.filter((u: any) => u.role === "barber").length;

    // New users this month
    const newUsersThisMonth = allUsers.filter((u: any) => u.createdAt >= thirtyDaysAgo).length;

    // Appointments
    const allAppointments = await ctx.db.query("appointments").collect();
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter(
      (a: any) => a.status === "completed"
    ).length;
    const appointmentsThisWeek = allAppointments.filter(
      (a: any) => a.scheduledFor >= sevenDaysAgo
    ).length;

    // Revenue (completed appointments in last 30 days)
    const recentCompleted = allAppointments.filter(
      (a: any) => a.status === "completed" && a.scheduledFor >= thirtyDaysAgo
    );
    const revenueThisMonth = recentCompleted.reduce((sum: number, a: any) => sum + a.price, 0);

    // Orders
    const allOrders = await ctx.db.query("orders").collect();
    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter((o: any) => o.paymentStatus === "paid");
    const orderRevenueThisMonth = paidOrders
      .filter((o: any) => o.createdAt >= thirtyDaysAgo)
      .reduce((sum: number, o: any) => sum + o.total, 0);

    const totalRevenueThisMonth = revenueThisMonth + orderRevenueThisMonth;

    // Verified barbers
    const verifiedBarbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_verified", (q: any) => q.eq("isVerified", true))
      .collect();

    return {
      totalUsers,
      totalClients,
      totalBarbers,
      newUsersThisMonth,
      totalAppointments,
      completedAppointments,
      appointmentsThisWeek,
      totalRevenueThisMonthDollars: totalRevenueThisMonth / 100,
      platformRevenueThisMonthDollars: (totalRevenueThisMonth * 0.15) / 100,
      totalOrders,
      verifiedBarbersCount: verifiedBarbers.length,
      overallCompletionRate:
        totalAppointments > 0
          ? Math.round((completedAppointments / totalAppointments) * 100)
          : 0,
    };
  },
});
