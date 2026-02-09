import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Appointment Mutations
 */

// Book an appointment
export const bookAppointment = mutation({
  args: {
    barberId: v.id("users"),
    serviceId: v.string(),
    serviceName: v.string(),
    price: v.number(),
    duration: v.number(),
    scheduledFor: v.number(),
    locationType: v.union(v.literal("in_salon"), v.literal("in_home")),
    address: v.optional(v.string()),
    addressCoords: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify barber exists
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.barberId))
      .first();

    if (!barberProfile) {
      throw new Error("Barber not found");
    }

    if (!barberProfile.isAvailable) {
      throw new Error("Barber is not currently accepting appointments");
    }

    // Check if in-home service is offered
    if (args.locationType === "in_home" && !barberProfile.offersInHomeService) {
      throw new Error("This barber does not offer in-home service");
    }

    // Calculate end time
    const endTime = args.scheduledFor + args.duration * 60 * 1000;

    // Create appointment
    const appointment = await ctx.db.insert("appointments", {
      clientId: user._id,
      barberId: args.barberId,
      serviceId: args.serviceId,
      serviceName: args.serviceName,
      price: args.price,
      duration: args.duration,
      scheduledFor: args.scheduledFor,
      endTime,
      locationType: args.locationType,
      address: args.address,
      addressCoords: args.addressCoords,
      status: "pending",
      specialRequests: args.specialRequests,
      paymentStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return appointment;
  },
});

// Cancel appointment
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if user is authorized (client or barber)
    if (appointment.clientId !== user._id && appointment.barberId !== user._id) {
      throw new Error("Not authorized to cancel this appointment");
    }

    // Can't cancel completed or already cancelled appointments
    if (appointment.status === "completed" || appointment.status === "cancelled") {
      throw new Error("Cannot cancel this appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.appointmentId);
  },
});

// Update appointment status (for barbers)
export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("no_show")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify this barber owns the appointment
    if (appointment.barberId !== user._id) {
      throw new Error("Not authorized to update this appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.appointmentId);
  },
});
