import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Admin: Product Catalog Management
 *
 * Admins can view all products (including inactive), manage product categories,
 * moderate listings (approve, suspend), and perform bulk operations.
 */

// Helper: verify caller is admin
async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<{ email: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user || user.role !== "admin") {
    throw new Error("Not authorized: admin access required");
  }

  return user;
}

// ─────────────────────────────────────────────
// Product Queries (Admin)
// ─────────────────────────────────────────────

/**
 * Get all products (including inactive) with enriched barber info — admin view.
 */
export const adminGetAllProducts = query({
  args: {
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
    barberId: v.optional(v.id("users")),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let products = await ctx.db.query("products").collect();

    // Filters
    if (args.isActive !== undefined) {
      products = products.filter((p: any) => p.isActive === args.isActive);
    }
    if (args.category) {
      products = products.filter((p: any) => p.category === args.category);
    }
    if (args.barberId) {
      products = products.filter((p: any) => p.barberId === args.barberId);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(s))
      );
    }

    // Sort newest first
    products.sort((a: any, b: any) => b.createdAt - a.createdAt);

    const limit = args.limit ?? 50;
    const paginated = products.slice(0, limit);

    // Enrich with barber info
    return Promise.all(
      paginated.map(async (product: any) => {
        const barberProfile = await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q: any) => q.eq("userId", product.barberId))
          .first();
        const user = await ctx.db.get(product.barberId);
        return {
          ...product,
          barber: {
            businessName: barberProfile?.businessName,
            isVerified: barberProfile?.isVerified,
            email: user?.email,
          },
        };
      })
    );
  },
});

/**
 * Get product catalog stats (admin dashboard widget).
 */
export const getProductCatalogStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();

    const total = products.length;
    const active = products.filter((p: any) => p.isActive).length;
    const inactive = total - active;
    const outOfStock = products.filter(
      (p: any) => p.isActive && p.stock === 0
    ).length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    products.forEach((p: any) => {
      categoryBreakdown[p.category] =
        (categoryBreakdown[p.category] ?? 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      outOfStock,
      totalCategories: categories.length,
      categoryBreakdown,
    };
  },
});

// ─────────────────────────────────────────────
// Product Mutations (Admin)
// ─────────────────────────────────────────────

/**
 * Admin: activate or deactivate any product (moderation).
 */
export const adminSetProductActive = mutation({
  args: {
    productId: v.id("products"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await ctx.db.patch(args.productId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Admin: update any product (override barber ownership check).
 */
export const adminUpdateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    stock: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { productId, ...updates } = args;

    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    await ctx.db.patch(productId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(productId);
  },
});

/**
 * Admin: hard-delete a product permanently.
 */
export const adminDeleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

// ─────────────────────────────────────────────
// Category Management (Admin)
// ─────────────────────────────────────────────

/**
 * Get all categories (admin view — includes inactive).
 */
export const adminGetCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("categories").collect();
  },
});

/**
 * Create a new product category (admin only).
 */
export const adminCreateCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    image: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Ensure slug is unique
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (existing) throw new Error(`Slug "${args.slug}" is already in use`);

    const now = Date.now();
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      parentId: args.parentId,
      image: args.image,
      sortOrder: args.sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * Update a category (admin only).
 */
export const adminUpdateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    image: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { categoryId, ...updates } = args;

    const existing = await ctx.db.get(categoryId);
    if (!existing) throw new Error("Category not found");

    // Check slug uniqueness if changing
    if (updates.slug && updates.slug !== existing.slug) {
      const slugConflict = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q: any) => q.eq("slug", updates.slug))
        .first();
      if (slugConflict) throw new Error(`Slug "${updates.slug}" is already in use`);
    }

    await ctx.db.patch(categoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a category (admin only).
 * Prevents deletion if products are assigned to it.
 */
export const adminDeleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    // Check for products using this category
    const productsInCategory = await ctx.db
      .query("products")
      .withIndex("by_category_id", (q: any) =>
        q.eq("categoryId", args.categoryId)
      )
      .first();

    if (productsInCategory) {
      throw new Error(
        "Cannot delete category with assigned products. Reassign or deactivate products first."
      );
    }

    // Check for child categories
    const childCategories = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q: any) =>
        q.eq("parentId", args.categoryId)
      )
      .first();

    if (childCategories) {
      throw new Error(
        "Cannot delete category with sub-categories. Remove child categories first."
      );
    }

    await ctx.db.delete(args.categoryId);
    return { success: true };
  },
});
