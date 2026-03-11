import { mutation } from "./_generated/server";

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const ensureUser = async (input: {
      email: string;
      name: string;
      role: "client" | "barber" | "admin";
      phone?: string;
    }) => {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", input.email))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: input.name,
          role: input.role,
          phone: input.phone,
          isActive: true,
          updatedAt: now,
        });
        return existing._id;
      }

      return await ctx.db.insert("users", {
        email: input.email,
        emailVerified: true,
        name: input.name,
        phone: input.phone,
        role: input.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    };

    const clientId = await ensureUser({
      email: "demo.client@cloudclips.dev",
      name: "Demo Client",
      role: "client",
      phone: "+1 555-0101",
    });

    const barberId = await ensureUser({
      email: "demo.barber@cloudclips.dev",
      name: "Demo Barber",
      role: "barber",
      phone: "+1 555-0102",
    });

    const adminId = await ensureUser({
      email: "demo.admin@cloudclips.dev",
      name: "Demo Admin",
      role: "admin",
      phone: "+1 555-0103",
    });

    const existingBarberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", barberId))
      .first();

    if (existingBarberProfile) {
      await ctx.db.patch(existingBarberProfile._id, {
        businessName: "Cloud Clips Demo Studio",
        businessDescription: "Demo profile for local/dev testing",
        isAvailable: true,
        isVerified: true,
        averageRating: 4.8,
        reviewCount: 12,
        location: {
          lat: 40.7128,
          lng: -74.006,
          address: "123 Demo Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
        },
        services: [
          {
            id: "demo-cut",
            name: "Classic Cut",
            description: "Classic scissor and clipper cut",
            price: 35,
            duration: 30,
            category: "Haircut",
          },
          {
            id: "demo-fade",
            name: "Skin Fade",
            description: "Low/mid/high fade with styling",
            price: 45,
            duration: 45,
            category: "Fade",
          },
        ],
        workingHours: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isAvailable: true },
          { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", isAvailable: false },
        ],
        offersInHomeService: true,
        inHomeServiceRadius: 10,
        timezone: "America/New_York",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("barberProfiles", {
        userId: barberId,
        businessName: "Cloud Clips Demo Studio",
        businessDescription: "Demo profile for local/dev testing",
        location: {
          lat: 40.7128,
          lng: -74.006,
          address: "123 Demo Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
        },
        services: [
          {
            id: "demo-cut",
            name: "Classic Cut",
            description: "Classic scissor and clipper cut",
            price: 35,
            duration: 30,
            category: "Haircut",
          },
          {
            id: "demo-fade",
            name: "Skin Fade",
            description: "Low/mid/high fade with styling",
            price: 45,
            duration: 45,
            category: "Fade",
          },
        ],
        workingHours: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isAvailable: true },
          { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", isAvailable: false },
        ],
        averageRating: 4.8,
        reviewCount: 12,
        portfolioImages: [],
        isAvailable: true,
        isVerified: true,
        offersInHomeService: true,
        inHomeServiceRadius: 10,
        timezone: "America/New_York",
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      seeded: {
        clientEmail: "demo.client@cloudclips.dev",
        barberEmail: "demo.barber@cloudclips.dev",
        adminEmail: "demo.admin@cloudclips.dev",
      },
      ids: { clientId, barberId, adminId },
    };
  },
});
