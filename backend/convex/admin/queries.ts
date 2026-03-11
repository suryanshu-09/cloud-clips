import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Admin Queries - User Management
 *
 * All queries require the caller to be an admin.
 * These are used by the Admin Dashboard web app.
 */

/** Helper to assert the caller is an admin */
async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<{ email?: string } | null> }; db: any }) {
  const identity = await getIdentityOrDev(ctx);
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email ?? ""))
    .first();

  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized: admin access required");
  }

  return user;
}

/**
 * List all users with optional search and pagination.
 *
 * @param search   - Optional search string matched against name/email
 * @param role     - Optional role filter ("client" | "barber" | "admin")
 * @param cursor   - Pagination cursor (pass null for first page)
 * @param pageSize - Number of results per page (default 20, max 100)
 */
export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("client"), v.literal("barber"), v.literal("admin"))
    ),
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pageSize = Math.min(args.pageSize ?? 20, 100);
    const searchTerm = args.search?.trim().toLowerCase();

    // Build base query
    let allUsers;
    if (args.role) {
      allUsers = await ctx.db
        .query("users")
        .withIndex("by_role", (q: any) => q.eq("role", args.role))
        .order("desc")
        .collect();
    } else {
      allUsers = await ctx.db.query("users").order("desc").collect();
    }

    // Apply search filter in memory (Convex doesn't support full-text search on arbitrary fields natively)
    let filtered = allUsers;
    if (searchTerm) {
      filtered = allUsers.filter((u: any) => {
        const nameMatch = u.name?.toLowerCase().includes(searchTerm);
        const emailMatch = u.email?.toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch;
      });
    }

    // Manual cursor-based pagination using _id as cursor
    let startIdx = 0;
    if (args.cursor) {
      const idx = filtered.findIndex((u: any) => u._id === args.cursor);
      if (idx !== -1) {
        startIdx = idx + 1;
      }
    }

    const page = filtered.slice(startIdx, startIdx + pageSize);
    const nextCursor =
      startIdx + pageSize < filtered.length
        ? page[page.length - 1]?._id ?? null
        : null;

    // Strip sensitive fields before returning
    const safeUsers = page.map((u: any) => ({
      _id: u._id,
      email: u.email,
      emailVerified: u.emailVerified,
      name: u.name,
      phone: u.phone,
      avatar: u.avatar,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      users: safeUsers,
      total: filtered.length,
      nextCursor,
    };
  },
});

/**
 * Get a single user by ID with full details (admin view).
 * Includes barber profile if the user is a barber.
 */
export const adminGetUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    let barberProfile = null;
    if (user.role === "barber") {
      barberProfile = await ctx.db
        .query("barberProfiles")
        .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
        .first();
    }

    // Count appointments
    const clientAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_client", (q: any) => q.eq("clientId", args.userId))
      .collect();

    const barberAppointments =
      user.role === "barber"
        ? await ctx.db
            .query("appointments")
            .withIndex("by_barber", (q: any) => q.eq("barberId", args.userId))
            .collect()
        : [];

    return {
      _id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      barberProfile: barberProfile
        ? {
            _id: barberProfile._id,
            businessName: barberProfile.businessName,
            businessDescription: barberProfile.businessDescription,
            location: barberProfile.location,
            isVerified: barberProfile.isVerified,
            isAvailable: barberProfile.isAvailable,
            averageRating: barberProfile.averageRating,
            reviewCount: barberProfile.reviewCount,
            stripeAccountId: barberProfile.stripeAccountId,
            createdAt: barberProfile.createdAt,
          }
        : null,
      stats: {
        appointmentsAsClient: clientAppointments.length,
        appointmentsAsBarber: barberAppointments.length,
      },
    };
  },
});

/**
 * List barbers pending verification.
 * Returns barbers whose isVerified is false.
 */
export const listPendingVerifications = query({
  args: {
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pageSize = Math.min(args.pageSize ?? 20, 100);

    const unverifiedProfiles = await ctx.db
      .query("barberProfiles")
      .withIndex("by_verified", (q: any) => q.eq("isVerified", false))
      .order("asc")
      .collect();

    // Manual pagination
    let startIdx = 0;
    if (args.cursor) {
      const idx = unverifiedProfiles.findIndex((p: any) => p._id === args.cursor);
      if (idx !== -1) {
        startIdx = idx + 1;
      }
    }

    const page = unverifiedProfiles.slice(startIdx, startIdx + pageSize);
    const nextCursor =
      startIdx + pageSize < unverifiedProfiles.length
        ? page[page.length - 1]?._id ?? null
        : null;

    // Attach user info
    const results = await Promise.all(
      page.map(async (profile: Doc<"barberProfiles">) => {
        const user = await ctx.db.get(profile.userId);
        return {
          profileId: profile._id,
          userId: profile.userId,
          businessName: profile.businessName,
          location: profile.location,
          createdAt: profile.createdAt,
          user: user
            ? { email: user.email, name: user.name, avatar: user.avatar }
            : null,
        };
      })
    );

    return {
      profiles: results,
      total: unverifiedProfiles.length,
      nextCursor,
    };
  },
});

/**
 * Get admin overview stats for the user management dashboard.
 */
export const adminUserStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allUsers = await ctx.db.query("users").collect();

    const total = allUsers.length;
    const clients = allUsers.filter((u: any) => u.role === "client").length;
    const barbers = allUsers.filter((u: any) => u.role === "barber").length;
    const admins = allUsers.filter((u: any) => u.role === "admin").length;
    const active = allUsers.filter((u: any) => u.isActive).length;
    const banned = allUsers.filter((u: any) => !u.isActive).length;

    const unverifiedBarbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_verified", (q: any) => q.eq("isVerified", false))
      .collect();

    return {
      total,
      clients,
      barbers,
      admins,
      active,
      banned,
      pendingVerifications: unverifiedBarbers.length,
    };
  },
});
