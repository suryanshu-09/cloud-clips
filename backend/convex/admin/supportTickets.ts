import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { requireAdmin, requireAuthUser } from "./auth";

/**
 * Admin: Support Tickets
 *
 * Users can submit support tickets. Admins can view, prioritize, assign,
 * respond (with public or internal-only messages), and resolve tickets.
 * A threaded message system (supportTicketMessages) tracks conversation history.
 */

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get all support tickets (admin view).
 */
export const adminGetAllTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_user"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("billing"),
        v.literal("booking"),
        v.literal("account"),
        v.literal("technical"),
        v.literal("barber"),
        v.literal("other")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("normal"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assignedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let tickets = await ctx.db.query("supportTickets").collect();

    if (args.status) {
      tickets = tickets.filter((t: any) => t.status === args.status);
    }
    if (args.category) {
      tickets = tickets.filter((t: any) => t.category === args.category);
    }
    if (args.priority) {
      tickets = tickets.filter((t: any) => t.priority === args.priority);
    }
    if (args.assignedTo) {
      tickets = tickets.filter((t: any) => t.assignedTo === args.assignedTo);
    }

    // Sort: urgent first, then by createdAt desc
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    tickets.sort((a: any, b: any) => {
      const pa = priorityOrder[a.priority] ?? 4;
      const pb = priorityOrder[b.priority] ?? 4;
      if (pa !== pb) return pa - pb;
      return b.createdAt - a.createdAt;
    });

    const limit = args.limit ?? 50;
    const paginated = tickets.slice(0, limit);

    // Enrich with user info
    return Promise.all(
      paginated.map(async (ticket: Doc<"supportTickets">) => {
        const user = await ctx.db.get(ticket.userId);
        const assignee = ticket.assignedTo
          ? await ctx.db.get(ticket.assignedTo)
          : null;
        return {
          ...ticket,
          user: user
            ? { name: user.name, email: user.email, role: user.role }
            : null,
          assignee: assignee
            ? { name: assignee.name, email: assignee.email }
            : null,
        };
      })
    );
  },
});

/**
 * Get a single ticket with its full message thread (admin view).
 * Includes internal notes.
 */
export const adminGetTicketById = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    const user = await ctx.db.get(ticket.userId);
    const assignee = ticket.assignedTo
      ? await ctx.db.get(ticket.assignedTo)
      : null;

    const messages = await ctx.db
      .query("supportTicketMessages")
      .withIndex("by_ticket_created", (q: any) =>
        q.eq("ticketId", args.ticketId)
      )
      .collect();

    // Enrich messages with sender info
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: Doc<"supportTicketMessages">) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: sender
            ? { name: sender.name, email: sender.email, role: sender.role }
            : null,
        };
      })
    );

    return {
      ...ticket,
      user: user
        ? { name: user.name, email: user.email, role: user.role }
        : null,
      assignee: assignee
        ? { name: assignee.name, email: assignee.email }
        : null,
      messages: enrichedMessages,
    };
  },
});

/**
 * Get support ticket stats for admin dashboard.
 */
export const getSupportTicketStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const tickets = await ctx.db.query("supportTickets").collect();

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    tickets.forEach((t: any) => {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    });

    const open = tickets.filter((t: any) =>
      ["open", "in_progress", "waiting_on_user"].includes(t.status)
    ).length;
    const resolved = tickets.filter((t: any) =>
      ["resolved", "closed"].includes(t.status)
    ).length;

    return {
      total: tickets.length,
      open,
      resolved,
      byStatus,
      byCategory,
      byPriority,
    };
  },
});

/**
 * Get the current user's own support tickets.
 */
export const getMyTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_user"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    let tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    if (args.status) {
      tickets = tickets.filter((t: any) => t.status === args.status);
    }

    return tickets.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single ticket for the user who submitted it (public messages only).
 */
export const getMyTicketById = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;
    if (ticket.userId !== user._id) throw new Error("Not authorized");

    const messages = await ctx.db
      .query("supportTicketMessages")
      .withIndex("by_ticket_created", (q: any) =>
        q.eq("ticketId", args.ticketId)
      )
      .collect();

    // Filter out internal notes for non-admin users
    const publicMessages = messages.filter((m: any) => !m.isInternal);

    const enrichedMessages = await Promise.all(
      publicMessages.map(async (msg: Doc<"supportTicketMessages">) => {
        const sender = await ctx.db.get(msg.senderId);
        const isAdmin = sender?.role === "admin";
        return {
          ...msg,
          sender: {
            name: isAdmin ? "Support Team" : sender?.name,
            isAdmin,
          },
        };
      })
    );

    return {
      ...ticket,
      messages: enrichedMessages,
    };
  },
});

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Submit a new support ticket (any authenticated user).
 */
export const submitSupportTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("billing"),
      v.literal("booking"),
      v.literal("account"),
      v.literal("technical"),
      v.literal("barber"),
      v.literal("other")
    ),
    attachments: v.optional(v.array(v.string())),
    relatedAppointmentId: v.optional(v.id("appointments")),
    relatedOrderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      userId: user._id,
      subject: args.subject,
      description: args.description,
      category: args.category,
      priority: "normal",
      status: "open",
      attachments: args.attachments,
      relatedAppointmentId: args.relatedAppointmentId,
      relatedOrderId: args.relatedOrderId,
      createdAt: now,
      updatedAt: now,
    });

    return ticketId;
  },
});

/**
 * Reply to a support ticket (user adds a follow-up message).
 */
export const replyToTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Users can only reply to their own tickets
    if (user.role !== "admin" && ticket.userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Closed tickets cannot be replied to
    if (ticket.status === "closed") {
      throw new Error("Cannot reply to a closed ticket");
    }

    const now = Date.now();
    await ctx.db.insert("supportTicketMessages", {
      ticketId: args.ticketId,
      senderId: user._id,
      message: args.message,
      isInternal: false,
      attachments: args.attachments,
      createdAt: now,
    });

    // Update ticket status: if user replies to a "waiting_on_user" ticket, reopen it
    const newStatus =
      ticket.status === "waiting_on_user" && user.role !== "admin"
        ? "open"
        : ticket.status;

    await ctx.db.patch(args.ticketId, {
      status: newStatus,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Admin: update ticket status, priority, and assignment.
 */
export const adminUpdateTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_user"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("normal"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assignedTo: v.optional(v.id("users")),
    adminNotes: v.optional(v.string()),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const { ticketId, ...updates } = args;

    const ticket = await ctx.db.get(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    const patch: Record<string, any> = { ...updates, updatedAt: now };

    // Record resolution metadata
    if (
      updates.status === "resolved" ||
      updates.status === "closed"
    ) {
      patch.resolvedAt = now;
      patch.resolvedBy = admin._id;
    }

    await ctx.db.patch(ticketId, patch);
    return { success: true };
  },
});

/**
 * Admin: add a reply or internal note to a ticket.
 */
export const adminReplyToTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
    isInternal: v.optional(v.boolean()), // defaults to false (visible to user)
    attachments: v.optional(v.array(v.string())),
    updateStatus: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_user"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    await ctx.db.insert("supportTicketMessages", {
      ticketId: args.ticketId,
      senderId: admin._id,
      message: args.message,
      isInternal: args.isInternal ?? false,
      attachments: args.attachments,
      createdAt: now,
    });

    // Optionally update ticket status in the same operation
    const patch: Record<string, any> = { updatedAt: now };
    if (args.updateStatus) {
      patch.status = args.updateStatus;
      if (
        args.updateStatus === "resolved" ||
        args.updateStatus === "closed"
      ) {
        patch.resolvedAt = now;
        patch.resolvedBy = admin._id;
      }
    } else if (ticket.status === "open") {
      // Auto-advance to in_progress when admin first replies
      patch.status = "in_progress";
      patch.assignedTo = ticket.assignedTo ?? admin._id;
    }

    await ctx.db.patch(args.ticketId, patch);
    return { success: true };
  },
});

/**
 * User: close their own ticket (if resolved/no longer needed).
 */
export const closeMyTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.userId !== user._id) throw new Error("Not authorized");

    if (ticket.status === "closed") {
      throw new Error("Ticket is already closed");
    }

    await ctx.db.patch(args.ticketId, {
      status: "closed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
