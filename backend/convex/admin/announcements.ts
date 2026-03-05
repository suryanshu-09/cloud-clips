import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { getAuthUserOrNull, requireAdmin } from "./auth";

/**
 * Admin: System Announcements
 *
 * Admins create announcements that are broadcast to all users, clients only,
 * or barbers only. Announcements can be banners, modals, or push notifications.
 * They support scheduling (publishAt) and optional expiry (expiresAt).
 */

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get all announcements (admin view — includes drafts and expired).
 */
export const getAllAnnouncements = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("expired"))
    ),
    audience: v.optional(
      v.union(v.literal("all"), v.literal("clients"), v.literal("barbers"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    let announcements = await ctx.db
      .query("announcements")
      .order("desc")
      .collect();

    // Filter by audience
    if (args.audience) {
      announcements = announcements.filter(
        (a: any) => a.targetAudience === args.audience
      );
    }

    // Filter by derived status
    if (args.status) {
      announcements = announcements.filter((a: any) => {
        if (args.status === "draft") return a.isDraft;
        if (args.status === "active")
          return (
            !a.isDraft &&
            a.isActive &&
            a.publishAt <= now &&
            (!a.expiresAt || a.expiresAt > now)
          );
        if (args.status === "expired")
          return a.expiresAt && a.expiresAt <= now;
        return true;
      });
    }

    const limit = args.limit ?? 50;
    const paginated = announcements.slice(0, limit);

    // Enrich with creator info
    return Promise.all(
      paginated.map(async (a: Doc<"announcements">) => {
        const creator = await ctx.db.get(a.createdBy);
        return {
          ...a,
          creator: creator
            ? { name: creator.name, email: creator.email }
            : null,
        };
      })
    );
  },
});

/**
 * Get active announcements for a specific user (used by mobile app).
 * Returns published, non-expired, non-draft announcements matching the user's role.
 */
export const getActiveAnnouncementsForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserOrNull(ctx);

    if (!user) return [];

    const now = Date.now();

    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .collect();

    return announcements.filter((a: any) => {
      if (a.isDraft) return false;
      if (a.publishAt > now) return false;
      if (a.expiresAt && a.expiresAt <= now) return false;
      // Audience check
      if (a.targetAudience === "all") return true;
      if (a.targetAudience === "clients") return user.role === "client";
      if (a.targetAudience === "barbers") return user.role === "barber";
      return false;
    });
  },
});

/**
 * Get a single announcement by ID (admin only).
 */
export const getAnnouncementById = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) return null;

    const creator = await ctx.db.get(announcement.createdBy);
    return {
      ...announcement,
      creator: creator
        ? { name: creator.name, email: creator.email }
        : null,
    };
  },
});

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Create a new announcement (admin only).
 * Creates as draft by default unless isDraft = false.
 */
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("clients"),
      v.literal("barbers")
    ),
    displayType: v.union(
      v.literal("banner"),
      v.literal("modal"),
      v.literal("push")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    publishAt: v.optional(v.number()), // defaults to now
    expiresAt: v.optional(v.number()),
    isDraft: v.optional(v.boolean()),  // defaults to true (safe default)
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const now = Date.now();
    const announcementId = await ctx.db.insert("announcements", {
      createdBy: admin._id,
      title: args.title,
      body: args.body,
      targetAudience: args.targetAudience,
      displayType: args.displayType,
      priority: args.priority,
      publishAt: args.publishAt ?? now,
      expiresAt: args.expiresAt,
      isDraft: args.isDraft ?? true,
      isActive: true,
      ctaLabel: args.ctaLabel,
      ctaUrl: args.ctaUrl,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    return announcementId;
  },
});

/**
 * Update an existing announcement (admin only).
 */
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    targetAudience: v.optional(
      v.union(v.literal("all"), v.literal("clients"), v.literal("barbers"))
    ),
    displayType: v.optional(
      v.union(v.literal("banner"), v.literal("modal"), v.literal("push"))
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("normal"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    publishAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isDraft: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { announcementId, ...updates } = args;

    const existing = await ctx.db.get(announcementId);
    if (!existing) throw new Error("Announcement not found");

    await ctx.db.patch(announcementId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Publish a draft announcement immediately (admin only).
 */
export const publishAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.get(args.announcementId);
    if (!existing) throw new Error("Announcement not found");

    await ctx.db.patch(args.announcementId, {
      isDraft: false,
      isActive: true,
      publishAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Deactivate/archive an announcement (admin only).
 */
export const deactivateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.get(args.announcementId);
    if (!existing) throw new Error("Announcement not found");

    await ctx.db.patch(args.announcementId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an announcement permanently (admin only).
 * Only draft announcements can be hard-deleted; published ones are archived.
 */
export const deleteAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.get(args.announcementId);
    if (!existing) throw new Error("Announcement not found");

    if (!existing.isDraft) {
      throw new Error(
        "Cannot delete a published announcement. Use deactivateAnnouncement instead."
      );
    }

    await ctx.db.delete(args.announcementId);
    return { success: true };
  },
});
