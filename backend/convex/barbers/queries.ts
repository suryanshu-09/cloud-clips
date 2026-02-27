import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Barber Queries
 * 
 * Queries for fetching barber data with proper authentication and role checks
 */

/**
 * Get the current authenticated barber's profile
 * Only accessible to users with 'barber' role
 * Returns null if not authenticated or not a barber
 * Returns full profile with user details
 */
export const getBarberProfile = query({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return null;
    }

    // Role-based access control - only barbers can access
    if (user.role !== "barber") {
      throw new ConvexError("Access denied: Only barbers can access this profile");
    }

    // Get barber profile
    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      return null;
    }

    // Return profile with user details
    return {
      ...profile,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    };
  },
});

/**
 * Get nearby barbers with Haversine distance calculation and geo filtering
 * Returns barbers within the specified radius, sorted by distance
 * Includes calculated distance in miles for each barber
 */
export const getNearbyBarbers = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.number(), // in miles
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get all active barbers (in production, you'd want to use a geospatial index)
    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();

    // Calculate distances and filter by radius
    const barbersWithDistance = await Promise.all(
      barbers.map(async (barber) => {
        const distance = calculateDistance(
          args.lat,
          args.lng,
          barber.location.lat,
          barber.location.lng
        );

        // Get user details
        const user = await ctx.db.get(barber.userId);

        return {
          ...barber,
          distance,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    // Filter by radius, sort by distance, and limit results
    return barbersWithDistance
      .filter((barber) => barber.distance <= args.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
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

/**
 * Search barbers by name with pagination
 * Uses cursor-based pagination for efficient data fetching
 * Returns paginated results with hasMore flag and nextCursor
 */
export const searchBarbers = query({
  args: {
    query: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchTerm = args.query.toLowerCase().trim();

    if (!searchTerm) {
      return {
        barbers: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    // Get all available barbers (in production, consider using full-text search)
    let barbersQuery = ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true));

    // Apply cursor pagination if provided
    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor as any);
      if (cursorDoc) {
        barbersQuery = barbersQuery.filter((q) =>
          q.gt("businessName", cursorDoc.businessName)
        );
      }
    }

    // Fetch barbers with limit + 1 to determine if there are more results
    const barbers = await barbersQuery.take(limit + 1);

    // Filter by name match
    const filteredBarbers = barbers.filter((barber) =>
      barber.businessName.toLowerCase().includes(searchTerm)
    );

    // Determine pagination state
    const hasMore = filteredBarbers.length > limit;
    const resultsToReturn = hasMore
      ? filteredBarbers.slice(0, limit)
      : filteredBarbers;

    // Get user details for each barber
    const barbersWithUserDetails = await Promise.all(
      resultsToReturn.map(async (barber) => {
        const user = await ctx.db.get(barber.userId);

        return {
          ...barber,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    // Set next cursor to the last barber's ID
    const nextCursor = hasMore
      ? resultsToReturn[resultsToReturn.length - 1]._id
      : null;

    return {
      barbers: barbersWithUserDetails,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get a barber profile by user ID
 * Used internally for payment processing and other services
 */
export const getBarberProfileByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    // Get user details
    const user = await ctx.db.get(profile.userId);

    return {
      ...profile,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
          }
        : null,
    };
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

/**
 * Get barbers filtered by price range
 * Filters barbers based on their service prices
 * Returns barbers with at least one service within the specified price range
 */
export const getBarbersByPriceRange = query({
  args: {
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const minPrice = args.minPrice ?? 0;
    const maxPrice = args.maxPrice ?? Number.MAX_SAFE_INTEGER;

    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .take(limit);

    const filteredBarbers = barbers.filter((barber) => {
      if (!barber.services || barber.services.length === 0) {
        return false;
      }

      return barber.services.some(
        (service) => service.price >= minPrice && service.price <= maxPrice
      );
    });

    return await Promise.all(
      filteredBarbers.map(async (barber) => {
        const user = await ctx.db.get(barber.userId);
        return {
          ...barber,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get barbers filtered by minimum rating
 * Returns barbers with average rating greater than or equal to the specified minimum
 * Barbers with no ratings are excluded when minRating is specified
 */
export const getBarbersByRating = query({
  args: {
    minRating: v.number(), // 1-5
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_rating", (q) =>
        q.gte("averageRating", args.minRating)
      )
      .take(limit);

    return await Promise.all(
      barbers
        .filter((barber) => barber.isAvailable)
        .map(async (barber) => {
          const user = await ctx.db.get(barber.userId);
          return {
            ...barber,
            user: user
              ? {
                  _id: user._id,
                  name: user.name,
                  avatar: user.avatar,
                  phone: user.phone,
                }
              : null,
          };
        })
    );
  },
});

/**
 * Get barbers filtered by specialties
 * Returns barbers that have ALL the specified specialties
 */
export const getBarbersBySpecialties = query({
  args: {
    specialties: v.array(v.string()),
    matchAll: v.optional(v.boolean()), // if true, barber must have all specialties; if false, any specialty
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const matchAll = args.matchAll ?? false;

    if (args.specialties.length === 0) {
      return [];
    }

    const barbers = await ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .take(limit);

    const filteredBarbers = barbers.filter((barber) => {
      if (!barber.specialties || barber.specialties.length === 0) {
        return false;
      }

      if (matchAll) {
        return args.specialties.every((specialty) =>
          barber.specialties!.includes(specialty)
        );
      } else {
        return args.specialties.some((specialty) =>
          barber.specialties!.includes(specialty)
        );
      }
    });

    return await Promise.all(
      filteredBarbers.map(async (barber) => {
        const user = await ctx.db.get(barber.userId);
        return {
          ...barber,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Combined filter query for barbers
 * Allows filtering by price range, rating, and specialties simultaneously
 * All filters are optional and applied as AND conditions
 */
export const filterBarbers = query({
  args: {
    // Location filters
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()), // in miles

    // Price filters
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),

    // Rating filter
    minRating: v.optional(v.number()),

    // Specialties filter
    specialties: v.optional(v.array(v.string())),
    matchAllSpecialties: v.optional(v.boolean()),

    // Pagination
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let barbersQuery = ctx.db
      .query("barberProfiles")
      .withIndex("by_available", (q) => q.eq("isAvailable", true));

    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor as any);
      if (cursorDoc) {
        barbersQuery = barbersQuery.filter((q) =>
          q.gt("_creationTime", cursorDoc._creationTime)
        );
      }
    }

    let barbers = await barbersQuery.take(limit + 1);

    // Apply rating filter
    if (args.minRating !== undefined) {
      barbers = barbers.filter(
        (barber) =>
          barber.averageRating !== undefined &&
          barber.averageRating >= args.minRating!
      );
    }

    // Apply price range filter
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      const minPrice = args.minPrice ?? 0;
      const maxPrice = args.maxPrice ?? Number.MAX_SAFE_INTEGER;

      barbers = barbers.filter((barber) => {
        if (!barber.services || barber.services.length === 0) {
          return false;
        }
        return barber.services.some(
          (service) => service.price >= minPrice && service.price <= maxPrice
        );
      });
    }

    // Apply specialties filter
    if (args.specialties && args.specialties.length > 0) {
      const matchAll = args.matchAllSpecialties ?? false;

      barbers = barbers.filter((barber) => {
        if (!barber.specialties || barber.specialties.length === 0) {
          return false;
        }

        if (matchAll) {
          return args.specialties!.every((specialty) =>
            barber.specialties!.includes(specialty)
          );
        } else {
          return args.specialties!.some((specialty) =>
            barber.specialties!.includes(specialty)
          );
        }
      });
    }

    // Apply location filter if coordinates provided
    if (
      args.lat !== undefined &&
      args.lng !== undefined &&
      args.radius !== undefined
    ) {
      barbers = barbers
        .map((barber) => ({
          ...barber,
          distance: calculateDistance(
            args.lat!,
            args.lng!,
            barber.location.lat,
            barber.location.lng
          ),
        }))
        .filter((barber) => (barber as any).distance <= args.radius!)
        .sort((a, b) => (a as any).distance - (b as any).distance);
    }

    const hasMore = barbers.length > limit;
    const resultsToReturn = hasMore ? barbers.slice(0, limit) : barbers;

    const barbersWithUserDetails = await Promise.all(
      resultsToReturn.map(async (barber) => {
        const user = await ctx.db.get(barber.userId);
        return {
          ...barber,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    const nextCursor = hasMore
      ? resultsToReturn[resultsToReturn.length - 1]._id
      : null;

    return {
      barbers: barbersWithUserDetails,
      nextCursor,
      hasMore,
    };
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
