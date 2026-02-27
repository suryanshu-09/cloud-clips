import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Product Queries
 */

// Get all products (with optional filters)
export const getProducts = query({
  args: {
    category: v.optional(v.string()),
    barberId: v.optional(v.id("users")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // product _id cursor for keyset pagination
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Use the most selective index available
    let baseQuery;
    if (args.category) {
      // Use the by_category index when filtering by category — much more selective
      baseQuery = ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true));
    } else if (args.barberId) {
      // Use the by_barber index when filtering by barber
      baseQuery = ctx.db
        .query("products")
        .withIndex("by_barber", (q) => q.eq("barberId", args.barberId!))
        .filter((q) => q.eq(q.field("isActive"), true));
    } else {
      baseQuery = ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true));
    }

    // Fetch limit + 1 to detect if there are more pages
    let products = await baseQuery.take(limit + 1);

    // Apply remaining in-memory filters
    if (args.category && !ctx.db.query("products").withIndex) {
      // already filtered by index above
    }
    if (args.barberId && args.category) {
      // when both are specified, secondary filter in memory
      products = products.filter((p) => p.barberId === args.barberId);
    }

    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    const hasMore = products.length > limit;
    const page = hasMore ? products.slice(0, limit) : products;

    // Enrich with barber info (only for the returned page)
    const enrichedProducts = await Promise.all(
      page.map(async (product) => {
        const barberProfile = await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q) => q.eq("userId", product.barberId))
          .first();

        return {
          ...product,
          barber: {
            businessName: barberProfile?.businessName,
          },
        };
      })
    );

    return {
      products: enrichedProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)),
      nextCursor: hasMore ? page[page.length - 1]._id : null,
      hasMore,
    };
  },
});

// Get product by ID
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", product.barberId))
      .first();

    return {
      ...product,
      barber: {
        businessName: barberProfile?.businessName,
        location: barberProfile?.location,
      },
    };
  },
});

// Get products by category
export const getProductsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const limit = args.limit || 20;
    return products.slice(0, limit);
  },
});

// Search products
export const searchProducts = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();
    
    let products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchLower))
    );

    if (args.category) {
      products = products.filter((p) => p.category === args.category);
    }

    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const barberProfile = await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q) => q.eq("userId", product.barberId))
          .first();

        return {
          ...product,
          barber: {
            businessName: barberProfile?.businessName,
          },
        };
      })
    );

    const limit = args.limit || 20;
    return enrichedProducts.slice(0, limit);
  },
});

// Get my products (for barbers)
export const getMyProducts = query({
  args: {},
  handler: async (ctx) => {
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

    return await ctx.db
      .query("products")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .collect();
  },
});

// Get categories — uses the dedicated categories table when populated,
// falls back to deriving from products table for backwards compatibility
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Prefer the dedicated categories table (indexed, fast)
    const categoriesFromTable = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (categoriesFromTable.length > 0) {
      return categoriesFromTable
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map((c) => c.name);
    }

    // Fallback: derive distinct category strings from products
    // Use take() with a reasonable limit to avoid full table scan
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(500);

    const categories = new Set<string>();
    products.forEach((p) => categories.add(p.category));

    return Array.from(categories).sort();
  },
});
