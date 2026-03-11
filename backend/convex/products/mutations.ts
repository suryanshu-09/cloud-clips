import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Product Mutations
 */

// Create product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    stock: v.number(),
    images: v.array(v.string()),
    category: v.string(),
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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

    const product = await ctx.db.insert("products", {
      barberId: user._id,
      name: args.name,
      description: args.description,
      price: args.price,
      stock: args.stock,
      images: args.images,
      category: args.category,
      subcategory: args.subcategory,
      tags: args.tags,
      isActive: true,
      averageRating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return product;
  },
});

// Update product
export const updateProduct = mutation({
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

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.barberId !== user._id) {
      throw new Error("Not authorized to update this product");
    }

    const { productId, ...updates } = args;

    await ctx.db.patch(args.productId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.productId);
  },
});

// Delete product (soft delete by deactivating)
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
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

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.barberId !== user._id) {
      throw new Error("Not authorized to delete this product");
    }

    await ctx.db.patch(args.productId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update stock
export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(), // positive to add, negative to subtract
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

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.barberId !== user._id) {
      throw new Error("Not authorized");
    }

    const newStock = product.stock + args.quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.productId, {
      stock: newStock,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.productId);
  },
});
