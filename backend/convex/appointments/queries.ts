import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Appointment Queries
 */

// Get user's appointments
export const getMyAppointments = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    )),
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

    let appointments;
    if (user.role === "barber") {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_barber", (q) => q.eq("barberId", user._id))
        .collect();
    } else {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
    }

    if (args.status) {
      appointments = appointments.filter((a) => a.status === args.status);
    }

    // Sort by scheduled time
    return appointments.sort((a, b) => b.scheduledFor - a.scheduledFor);
  },
});

// Get appointment by ID
export const getAppointmentById = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return null;

    // Get client and barber details
    const client = await ctx.db.get(appointment.clientId);
    const barber = await ctx.db.get(appointment.barberId);
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", appointment.barberId))
      .first();

    return {
      ...appointment,
      client: {
        name: client?.name,
        avatar: client?.avatar,
        phone: client?.phone,
      },
      barber: {
        name: barber?.name,
        avatar: barber?.avatar,
        businessName: barberProfile?.businessName,
      },
    };
  },
});

// Check barber availability
export const checkAvailability = query({
  args: {
    barberId: v.id("users"),
    date: v.number(), // timestamp for the day
  },
  handler: async (ctx, args) => {
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.barberId))
      .first();

    if (!barberProfile) {
      throw new Error("Barber not found");
    }

    // Get day of week
    const date = new Date(args.date);
    const dayOfWeek = date.getDay();

    // Get working hours for this day
    const workingHours = barberProfile.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable
    );

    if (!workingHours) {
      return []; // No availability on this day
    }

    // Get existing appointments for this day
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_barber_scheduled", (q) =>
        q.eq("barberId", args.barberId)
      )
      .filter((q) =>
        q.gte("scheduledFor", startOfDay.getTime()) &&
        q.lte("scheduledFor", endOfDay.getTime()) &&
        q.neq("status", "cancelled")
      )
      .collect();

    // Generate available time slots
    const slots = generateTimeSlots(
      workingHours.startTime,
      workingHours.endTime,
      existingAppointments
    );

    return slots;
  },
});

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  bookedAppointments: any[]
): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  // Generate 30-minute slots
  const current = new Date(start);
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5);
    
    // Check if this slot is booked
    const isBooked = bookedAppointments.some((apt) => {
      const aptTime = new Date(apt.scheduledFor);
      const aptTimeString = aptTime.toTimeString().slice(0, 5);
      return aptTimeString === timeString;
    });

    if (!isBooked) {
      slots.push(timeString);
    }

    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}
