import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { fromTimestamp, getDateRange, toUTCTimestamp, formatTime } from "../lib/timezone";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
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
      throw new ConvexError("Barber not found");
    }

    // Get day of week and date string in UTC
    const { date: dateStr, dayOfWeek } = fromTimestamp(args.date);

    // Get working hours for this day
    const workingHours = barberProfile.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable
    );

    if (!workingHours) {
      return []; // No availability on this day
    }

    // Get UTC start/end of day boundaries
    const { startOfDay, endOfDay } = getDateRange(dateStr);

    const existingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_barber_scheduled", (q) =>
        q
          .eq("barberId", args.barberId)
          .gte("scheduledFor", startOfDay)
          .lte("scheduledFor", endOfDay)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .collect();

    // Load time-off blocks that overlap this date
    const timeOffBlocks = await ctx.db
      .query("timeOffBlocks")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .collect();

    const dayBlocks = timeOffBlocks.filter(
      (b) => dateStr >= b.startDate && dateStr <= b.endDate
    );

    // If any full-day block covers this date, return no availability
    const hasFullDayBlock = dayBlocks.some((b) => !b.startTime || !b.endTime);
    if (hasFullDayBlock) return [];

    // Generate available time slots using UTC-based date string
    const slots = generateTimeSlots(
      workingHours.startTime,
      workingHours.endTime,
      existingAppointments,
      dateStr,
      dayBlocks as Array<{ startTime: string; endTime: string }>
    );

    return slots;
  },
});

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  bookedAppointments: Array<{ scheduledFor: number; endTime: number }>,
  dateStr: string,
  partialDayBlocks: Array<{ startTime: string; endTime: string }> = []
): string[] {
  const slots: string[] = [];

  // Use UTC-based timestamps from the timezone utilities
  const startMs = toUTCTimestamp(dateStr, startTime);
  const endMs = toUTCTimestamp(dateStr, endTime);

  const slotDurationMs = 30 * 60 * 1000; // 30 minutes in ms

  // Generate 30-minute slots
  let currentMs = startMs;
  while (currentMs < endMs) {
    const slotEndMs = currentMs + slotDurationMs;

    // Check if this slot overlaps with any booked appointment
    const isBooked = bookedAppointments.some((apt) => {
      // Two intervals overlap if one starts before the other ends and vice versa
      return apt.scheduledFor < slotEndMs && apt.endTime > currentMs;
    });

    // Check if this slot falls within a partial-day time-off block
    const slotTimeStr = formatTime(currentMs);
    const slotMinutes = timeToMinutes(slotTimeStr);
    const isBlocked = partialDayBlocks.some((block) => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return slotMinutes >= blockStart && slotMinutes < blockEnd;
    });

    if (!isBooked && !isBlocked) {
      slots.push(slotTimeStr);
    }

    currentMs += slotDurationMs;
  }

  return slots;
}
