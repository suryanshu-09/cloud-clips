import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Admin Mutations - User Management
 *
 * All mutations require the caller to be an admin.
 * These are used by the Admin Dashboard web app.
 */

/** Helper to assert the caller is an admin and return their user record */
async function requireAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<{ email?: string } | null> };
  db: any;
}) {
  const identity = await getIdentityOrDev(ctx);
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const admin = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email ?? ""))
    .first();

  if (!admin || admin.role !== "admin") {
    throw new ConvexError("Unauthorized: admin access required");
  }

  return admin;
}

/**
 * Ban a user by setting isActive to false.
 * Admins cannot ban other admins.
 *
 * @param userId - The user to ban
 * @param reason - Optional reason for the ban (stored in audit log)
 */
export const banUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    // Prevent banning another admin
    if (target.role === "admin") {
      throw new ConvexError("Cannot ban an admin account");
    }

    // Prevent self-ban
    if (target._id === admin._id) {
      throw new ConvexError("Cannot ban your own account");
    }

    if (!target.isActive) {
      throw new ConvexError("User is already banned");
    }

    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true, userId: args.userId };
  },
});

/**
 * Unban a user by setting isActive to true.
 *
 * @param userId - The user to unban
 */
export const unbanUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    if (target.isActive) {
      throw new ConvexError("User is not banned");
    }

    await ctx.db.patch(args.userId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return { success: true, userId: args.userId };
  },
});

/**
 * Soft-delete a user account.
 * This anonymizes the user's PII while keeping foreign-key references intact.
 * Admins cannot delete other admins.
 *
 * @param userId - The user to delete
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    if (target.role === "admin") {
      throw new ConvexError("Cannot delete an admin account");
    }

    if (target._id === admin._id) {
      throw new ConvexError("Cannot delete your own account");
    }

    // Anonymize PII instead of hard-delete to preserve foreign-key integrity
    const anonymizedEmail = `deleted_${args.userId}@cloudclips.deleted`;
    await ctx.db.patch(args.userId, {
      email: anonymizedEmail,
      name: "Deleted User",
      phone: undefined,
      avatar: undefined,
      isActive: false,
      pushTokens: [],
      linkedAccounts: {},
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    // Deactivate barber profile if exists
    if (target.role === "barber") {
      const profile = await ctx.db
        .query("barberProfiles")
        .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
        .first();

      if (profile) {
        await ctx.db.patch(profile._id, {
          isAvailable: false,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true, userId: args.userId };
  },
});

/**
 * Verify a barber's profile, granting them the verified badge.
 *
 * @param userId - The barber user's ID
 */
export const verifyBarber = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    if (target.role !== "barber") {
      throw new ConvexError("User is not a barber");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new ConvexError("Barber profile not found");
    }

    if (profile.isVerified) {
      throw new ConvexError("Barber is already verified");
    }

    await ctx.db.patch(profile._id, {
      isVerified: true,
      updatedAt: Date.now(),
    });

    return { success: true, userId: args.userId, profileId: profile._id };
  },
});

/**
 * Revoke a barber's verification.
 *
 * @param userId - The barber user's ID
 */
export const revokeBarberVerification = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    if (target.role !== "barber") {
      throw new ConvexError("User is not a barber");
    }

    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new ConvexError("Barber profile not found");
    }

    if (!profile.isVerified) {
      throw new ConvexError("Barber is not verified");
    }

    await ctx.db.patch(profile._id, {
      isVerified: false,
      updatedAt: Date.now(),
    });

    return { success: true, userId: args.userId, profileId: profile._id };
  },
});

/**
 * Change a user's role.
 * Can promote a client to barber or admin, or demote accordingly.
 * Cannot change your own role.
 *
 * @param userId  - Target user
 * @param newRole - "client" | "barber" | "admin"
 */
export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("client"),
      v.literal("barber"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.userId === admin._id) {
      throw new ConvexError("Cannot change your own role");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found");
    }

    if (target.role === args.newRole) {
      throw new ConvexError(`User already has role: ${args.newRole}`);
    }

    await ctx.db.patch(args.userId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });

    return { success: true, userId: args.userId, newRole: args.newRole };
  },
});
