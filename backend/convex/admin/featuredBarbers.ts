import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Admin: Featured Barbers
 *
 * Allows admins to mark barbers as "featured" for homepage/discovery promotion.
 * Featured status can have an optional expiry date.
 */

// Helper: verify caller is admin
async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<{ email: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user || user.role !== "admin") {
    throw new Error("Not authorized: admin access required");
  }

  return user;
}

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get all currently featured barbers (active, not expired).
 */
export const getFeaturedBarbers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const profiles = await ctx.db
      .query("barberProfiles")
      .collect();

    const featured = profiles.filter((p: any) => {
      if (!p.isFeatured) return false;
      // Exclude expired featured slots
      if (p.featuredUntil && p.featuredUntil < now) return false;
      return true;
    });

    // Enrich with user info
    return Promise.all(
      featured.map(async (profile: any) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: user
            ? { name: user.name, email: user.email, avatar: user.avatar }
            : null,
        };
      })
    );
  },
});

/**
 * Get all featured barbers including expired ones (admin view).
 */
export const getAllFeaturedBarbers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const profiles = await ctx.db
      .query("barberProfiles")
      .collect();

    const featured = profiles.filter((p: any) => p.isFeatured);

    return Promise.all(
      featured.map(async (profile: any) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: user
            ? { name: user.name, email: user.email, avatar: user.avatar }
            : null,
          isExpired: profile.featuredUntil
            ? profile.featuredUntil < Date.now()
            : false,
        };
      })
    );
  },
});

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Feature a barber (admin only).
 * Optionally set an expiry date for the featured slot.
 */
export const featureBarber = mutation({
  args: {
    barberProfileId: v.id("barberProfiles"),
    featuredUntil: v.optional(v.number()), // timestamp; omit for indefinite
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const profile = await ctx.db.get(args.barberProfileId);
    if (!profile) throw new Error("Barber profile not found");

    await ctx.db.patch(args.barberProfileId, {
      isFeatured: true,
      featuredAt: Date.now(),
      featuredUntil: args.featuredUntil,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unfeature a barber (admin only).
 */
export const unfeatureBarber = mutation({
  args: {
    barberProfileId: v.id("barberProfiles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const profile = await ctx.db.get(args.barberProfileId);
    if (!profile) throw new Error("Barber profile not found");

    await ctx.db.patch(args.barberProfileId, {
      isFeatured: false,
      featuredAt: undefined,
      featuredUntil: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update the featured expiry date for a barber (admin only).
 */
export const updateFeaturedExpiry = mutation({
  args: {
    barberProfileId: v.id("barberProfiles"),
    featuredUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const profile = await ctx.db.get(args.barberProfileId);
    if (!profile) throw new Error("Barber profile not found");
    if (!profile.isFeatured) throw new Error("Barber is not currently featured");

    await ctx.db.patch(args.barberProfileId, {
      featuredUntil: args.featuredUntil,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
