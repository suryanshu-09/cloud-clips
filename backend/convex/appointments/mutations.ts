import { mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

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
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
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

    // Calculate end time (scheduledFor and endTime are UTC timestamps)
    const endTime = args.scheduledFor + args.duration * 60 * 1000;

    // Double-booking prevention: check for overlapping appointments
    const existingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_barber_scheduled", (q) => q.eq("barberId", args.barberId))
      .collect();

    const hasConflict = existingAppointments.some((existing) => {
      // Skip cancelled and no_show appointments
      if (existing.status === "cancelled" || existing.status === "no_show") {
        return false;
      }
      // Check overlap: two ranges [existingStart, existingEnd) and [newStart, newEnd) overlap
      // if existingStart < newEnd AND newStart < existingEnd
      return existing.scheduledFor < endTime && args.scheduledFor < existing.endTime;
    });

    if (hasConflict) {
      throw new ConvexError(
        "This time slot is no longer available. Please choose a different time."
      );
    }

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
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
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
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
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

// Update appointment payment status
export const updatePaymentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("partially_refunded"),
      v.literal("failed")
    ),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    const updateFields: Record<string, unknown> = {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    };

    if (args.paymentIntentId !== undefined) {
      updateFields.paymentIntentId = args.paymentIntentId;
    }

    await ctx.db.patch(args.appointmentId, updateFields);

    return await ctx.db.get(args.appointmentId);
  },
});

// Reschedule an appointment to a new time
export const rescheduleAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    newScheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // 2. Fetch the appointment
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    // 3. Verify user is the client who booked it
    if (appointment.clientId !== user._id) {
      throw new ConvexError("Not authorized to reschedule this appointment");
    }

    // 4. Verify appointment is in a reschedulable status
    if (appointment.status !== "pending" && appointment.status !== "confirmed") {
      throw new ConvexError(
        "Only pending or confirmed appointments can be rescheduled"
      );
    }

    // 5. Calculate new end time (newScheduledFor and newEndTime are UTC timestamps)
    const newEndTime = args.newScheduledFor + appointment.duration * 60 * 1000;

    // 6. Check for conflicts with the barber's other appointments
    const barberAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_barber_scheduled", (q) =>
        q.eq("barberId", appointment.barberId)
      )
      .collect();

    const hasConflict = barberAppointments.some((existing) => {
      // Exclude the current appointment being rescheduled
      if (existing._id === args.appointmentId) {
        return false;
      }

      // Skip cancelled, completed, and no_show appointments
      if (
        existing.status === "cancelled" ||
        existing.status === "completed" ||
        existing.status === "no_show"
      ) {
        return false;
      }

      // Check overlap: two ranges overlap if start1 < end2 AND start2 < end1
      return (
        args.newScheduledFor < existing.endTime &&
        newEndTime > existing.scheduledFor
      );
    });

    if (hasConflict) {
      throw new ConvexError(
        "The selected time conflicts with an existing appointment"
      );
    }

    // 7. Update the appointment with new time and reset status to pending
    await ctx.db.patch(args.appointmentId, {
      scheduledFor: args.newScheduledFor,
      endTime: newEndTime,
      status: "pending",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.appointmentId);
  },
});

export const scheduleAppointmentReminder = mutation({
  args: {
    appointmentId: v.id("appointments"),
    reminderMinutesBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (appointment.clientId !== user._id && appointment.barberId !== user._id) {
      throw new ConvexError("Not authorized to schedule reminder for this appointment");
    }

    if (appointment.status === "cancelled" || appointment.status === "completed") {
      throw new ConvexError("Cannot schedule reminder for cancelled or completed appointment");
    }

    const reminderMinutes = args.reminderMinutesBefore ?? 30;
    const reminderTime = appointment.scheduledFor - reminderMinutes * 60 * 1000;
    const now = Date.now();

    if (reminderTime <= now) {
      return { scheduled: false, message: "Reminder time has already passed" };
    }

    const delayMs = reminderTime - now;

    await (ctx.scheduler as any).runAfter(delayMs, sendAppointmentReminder as any, {
      appointmentId: args.appointmentId,
      reminderMinutesBefore: reminderMinutes,
    });

    return {
      scheduled: true,
      reminderTime,
      message: `Reminder scheduled for ${reminderMinutes} minutes before appointment`,
    };
  },
});

export const sendAppointmentReminder = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    reminderMinutesBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      console.error(`Appointment ${args.appointmentId} not found for reminder`);
      return { success: false, error: "Appointment not found" };
    }

    if (appointment.status === "cancelled" || appointment.status === "completed") {
      return { success: false, error: "Appointment no longer active" };
    }

    const client = await ctx.db.get(appointment.clientId);
    const barber = await ctx.db.get(appointment.barberId);

    if (!client || !barber) {
      console.error("Client or barber not found for appointment reminder");
      return { success: false, error: "Client or barber not found" };
    }

    const appointmentDate = new Date(appointment.scheduledFor);
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const notificationData = {
      appointmentId: args.appointmentId,
      type: "appointment_reminder",
    };

    const clientTitle = "Appointment Reminder";
    const clientBody = `Your appointment with ${barber.name || "your barber"} is in ${args.reminderMinutesBefore} minutes (${formattedTime} on ${formattedDate})`;

    await ctx.db.insert("notifications", {
      userId: appointment.clientId,
      type: "appointment_reminder",
      title: clientTitle,
      body: clientBody,
      data: notificationData,
      isRead: false,
      createdAt: Date.now(),
    });

    const barberTitle = "Upcoming Appointment";
    const barberBody = `Appointment with ${client.name || "a client"} in ${args.reminderMinutesBefore} minutes (${formattedTime})`;

    await ctx.db.insert("notifications", {
      userId: appointment.barberId,
      type: "appointment_reminder",
      title: barberTitle,
      body: barberBody,
      data: notificationData,
      isRead: false,
      createdAt: Date.now(),
    });

    const clientPushTokens = client.pushTokens || [];
    const barberPushTokens = barber.pushTokens || [];

    const pushMessages = [];

    if (clientPushTokens.length > 0) {
      pushMessages.push(
        ...clientPushTokens.map((token) => ({
          to: token,
          sound: "default" as const,
          title: clientTitle,
          body: clientBody,
          data: notificationData,
        }))
      );
    }

    if (barberPushTokens.length > 0) {
      pushMessages.push(
        ...barberPushTokens.map((token) => ({
          to: token,
          sound: "default" as const,
          title: barberTitle,
          body: barberBody,
          data: notificationData,
        }))
      );
    }

    if (pushMessages.length > 0) {
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pushMessages),
        });

        if (!response.ok) {
          console.error(`Expo Push API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to send push notification:", error);
      }
    }

    return {
      success: true,
      clientNotified: clientPushTokens.length > 0,
      barberNotified: barberPushTokens.length > 0,
    };
  },
});

export const cancelAppointmentReminder = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    return { success: true, message: "Reminder cancellation handled via appointment status check" };
  },
});
