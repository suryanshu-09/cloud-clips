import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Barber Queries
 */

// Get nearby barbers with distance filtering
export const getNearbyBarbers = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.number(), // in miles
  },
  handler: async (ctx, args) => {
    // Get all active barbers (in production, you'd want to use a geospatial index)
    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();

    // Filter by distance
    return barbers.filter((barber) => {
      const distance = calculateDistance(
        args.lat,
        args.lng,
        barber.location.lat,
        barber.location.lng
      );
      return distance <= args.radius;
    });
  },
});

// Get barber by ID with full details
export const getBarberById = query({
  args: { barberId: v.id("barberProfiles") },
  handler: async (ctx, args) => {
    const barber = await ctx.db.get(args.barberId);
    if (!barber) return null;

    // Get user details
    const user = await ctx.db.get(barber.userId);
    
    return {
      ...barber,
      user: {
        name: user?.name,
        avatar: user?.avatar,
      },
    };
  },
});

// Search barbers by name
export const searchBarbers = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();

    const searchTerm = args.query.toLowerCase();
    return barbers.filter((barber) =>
      barber.businessName.toLowerCase().includes(searchTerm)
    );
  },
});

// Get barbers by specialty
export const getBarbersBySpecialty = query({
  args: {
    specialty: v.string(),
  },
  handler: async (ctx, args) => {
    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();

    return barbers.filter((barber) =>
      barber.specialties?.includes(args.specialty)
    );
  },
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
