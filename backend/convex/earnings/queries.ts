import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Earnings Queries
 *
 * Provide barbers with earnings summaries, history, and tax data
 * derived from receipts and appointments.
 */

// Platform fee rate (15%)
const PLATFORM_FEE_RATE = 0.15;

/**
 * Get earnings summary for the authenticated barber for a given period
 */
export const getBarberEarningsSummary = query({
  args: {
    period: v.union(
      v.literal("week"),
      v.literal("month"),
      v.literal("year"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized");
    }

    // Calculate date range
    const now = Date.now();
    let startDate: number | undefined;

    switch (args.period) {
      case "week": {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart.getTime();
        break;
      }
      case "month": {
        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        startDate = monthStart.getTime();
        break;
      }
      case "year": {
        const yearStart = new Date(now);
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        startDate = yearStart.getTime();
        break;
      }
      case "all":
      default:
        startDate = undefined;
        break;
    }

    // Fetch paid receipts for this barber
    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .order("desc")
      .collect();

    // Filter to paid receipts only
    receipts = receipts.filter(
      (r) => r.status === "paid" || r.status === "partially_refunded"
    );

    // Filter by date range
    if (startDate) {
      receipts = receipts.filter((r) => r.createdAt >= startDate!);
    }

    // Calculate totals
    let serviceEarnings = 0;
    let productEarnings = 0;
    let tips = 0;
    let serviceCount = 0;

    for (const receipt of receipts) {
      // Determine if this receipt is for an appointment or an order
      const isOrder = !!receipt.orderId && !receipt.appointmentId;

      const receiptSubtotal = receipt.subtotal || 0;
      const receiptTip = receipt.tip || 0;

      if (isOrder) {
        productEarnings += receiptSubtotal;
      } else {
        serviceEarnings += receiptSubtotal;
        serviceCount += 1;
      }

      tips += receiptTip;
    }

    const totalEarnings = serviceEarnings + productEarnings + tips;
    const platformFee = Math.round(totalEarnings * PLATFORM_FEE_RATE);
    const netEarnings = totalEarnings - platformFee;
    const avgPerService = serviceCount > 0 ? Math.round(netEarnings / serviceCount) : 0;

    return {
      period: args.period,
      totalEarnings,
      serviceEarnings,
      productEarnings,
      tips,
      platformFee,
      platformFeeRate: PLATFORM_FEE_RATE * 100,
      netEarnings,
      serviceCount,
      avgPerService,
      currency: "usd",
    };
  },
});

/**
 * Get paginated earnings history for the authenticated barber
 * Returns receipts transformed into earning items
 */
export const getBarberEarningsHistory = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // For cursor-based pagination (receipt ID)
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized");
    }

    const limit = Math.min(args.limit ?? 20, 50);

    // Fetch all paid receipts for this barber
    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .order("desc")
      .collect();

    // Filter to paid or partially refunded
    receipts = receipts.filter(
      (r) => r.status === "paid" || r.status === "partially_refunded"
    );

    // Filter by date range
    if (args.startDate) {
      receipts = receipts.filter((r) => r.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      receipts = receipts.filter((r) => r.createdAt <= args.endDate!);
    }

    const total = receipts.length;

    // Apply cursor-based pagination
    if (args.cursor) {
      const cursorIndex = receipts.findIndex((r) => r._id === args.cursor);
      if (cursorIndex !== -1) {
        receipts = receipts.slice(cursorIndex + 1);
      }
    }

    // Take page
    const pageReceipts = receipts.slice(0, limit);
    const nextCursor =
      pageReceipts.length === limit && receipts.length > limit
        ? pageReceipts[pageReceipts.length - 1]._id
        : null;

    // Enrich with client info and transform
    const earnings = await Promise.all(
      pageReceipts.map(async (receipt) => {
        const client = await ctx.db.get(receipt.clientId);
        const isOrder = !!receipt.orderId && !receipt.appointmentId;

        // Calculate net for this receipt
        const subtotal = receipt.subtotal || 0;
        const tip = receipt.tip || 0;
        const gross = subtotal + tip;
        const fee = Math.round(gross * PLATFORM_FEE_RATE);
        const net = gross - fee;

        // Build description from items
        const description =
          receipt.items.length > 0
            ? receipt.items.map((i) => i.name).join(", ")
            : isOrder
              ? "Product Sale"
              : "Service";

        return {
          id: receipt._id,
          type: isOrder ? ("product" as const) : ("service" as const),
          amount: gross,
          fee,
          net,
          description,
          customerName: client?.name ?? "Client",
          status: receipt.status,
          date: new Date(receipt.createdAt).toISOString(),
          tip: receipt.tip ?? 0,
        };
      })
    );

    return {
      earnings,
      total,
      nextCursor,
      hasMore: nextCursor !== null,
    };
  },
});

/**
 * Get tax summary for the authenticated barber by year
 * Returns annual totals for tax document generation
 */
export const getBarberTaxSummary = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized");
    }

    // Build year start/end timestamps
    const yearStart = new Date(args.year, 0, 1, 0, 0, 0, 0).getTime();
    const yearEnd = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();

    // Fetch paid receipts for this barber in the year
    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .order("desc")
      .collect();

    receipts = receipts.filter(
      (r) =>
        (r.status === "paid" || r.status === "partially_refunded") &&
        r.createdAt >= yearStart &&
        r.createdAt <= yearEnd
    );

    // Compute totals
    let grossEarnings = 0;
    let serviceEarnings = 0;
    let productEarnings = 0;
    let tips = 0;
    let refunds = 0;
    let transactionCount = receipts.length;

    // Monthly breakdown (index 0-11)
    const monthlyEarnings = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      gross: 0,
      net: 0,
      count: 0,
    }));

    for (const receipt of receipts) {
      const isOrder = !!receipt.orderId && !receipt.appointmentId;
      const subtotal = receipt.subtotal || 0;
      const tip = receipt.tip || 0;
      const gross = subtotal + tip;
      const refundedAmt = receipt.refundedAmount || 0;

      grossEarnings += gross;
      tips += tip;
      refunds += refundedAmt;

      if (isOrder) {
        productEarnings += subtotal;
      } else {
        serviceEarnings += subtotal;
      }

      // Monthly breakdown
      const monthIndex = new Date(receipt.createdAt).getMonth();
      const fee = Math.round(gross * PLATFORM_FEE_RATE);
      monthlyEarnings[monthIndex].gross += gross;
      monthlyEarnings[monthIndex].net += gross - fee;
      monthlyEarnings[monthIndex].count += 1;
    }

    const platformFees = Math.round(grossEarnings * PLATFORM_FEE_RATE);
    const netEarnings = grossEarnings - platformFees;

    // Determine if 1099-K threshold is met ($600 in the US for 2023+)
    const form1099KThreshold = 60000; // $600 in cents
    const qualifiesFor1099K = grossEarnings >= form1099KThreshold;

    return {
      year: args.year,
      grossEarnings,
      serviceEarnings,
      productEarnings,
      tips,
      platformFees,
      netEarnings,
      refunds,
      transactionCount,
      monthlyEarnings,
      qualifiesFor1099K,
      currency: "usd",
    };
  },
});

/**
 * Get available tax years for the barber (years in which they have receipts)
 */
export const getBarberTaxYears = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized");
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .collect();

    const years = new Set<number>();
    for (const receipt of receipts) {
      if (receipt.status === "paid" || receipt.status === "partially_refunded") {
        years.add(new Date(receipt.createdAt).getFullYear());
      }
    }

    // Always include current year
    years.add(new Date().getFullYear());

    return Array.from(years).sort((a, b) => b - a); // Most recent first
  },
});
