import { mutation } from "../_generated/server";
import { v } from "convex/values";

const addressValidator = v.object({
  label: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  instructions: v.optional(v.string()),
});

/**
 * Address Mutations
 *
 * Mutations for managing user shipping addresses
 */

/**
 * Add a new address for the current user
 */
export const addAddress = mutation({
  args: { address: addressValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existingAddresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const isFirstAddress = existingAddresses.length === 0;

    const addressId = await ctx.db.insert("addresses", {
      userId: user._id,
      label: args.address.label,
      line1: args.address.line1,
      line2: args.address.line2,
      city: args.address.city,
      state: args.address.state,
      zipCode: args.address.zipCode,
      country: args.address.country,
      instructions: args.address.instructions,
      isDefault: isFirstAddress,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return addressId;
  },
});

/**
 * Update an existing address
 */
export const updateAddress = mutation({
  args: {
    addressId: v.id("addresses"),
    address: v.object({
      label: v.optional(v.string()),
      line1: v.optional(v.string()),
      line2: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
      instructions: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== user._id) {
      throw new Error("Address not found");
    }

    await ctx.db.patch(args.addressId, {
      ...args.address,
      updatedAt: Date.now(),
    });

    return args.addressId;
  },
});

/**
 * Delete an address
 */
export const deleteAddress = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== user._id) {
      throw new Error("Address not found");
    }

    if (address.isDefault) {
      throw new Error(
        "Cannot delete the default address. Set another address as default first.",
      );
    }

    await ctx.db.delete(args.addressId);

    return true;
  },
});

/**
 * Set an address as the default
 */
export const setDefaultAddress = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const addressToSet = await ctx.db.get(args.addressId);
    if (!addressToSet || addressToSet.userId !== user._id) {
      throw new Error("Address not found");
    }

    const allAddresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const addr of allAddresses) {
      if (addr.isDefault) {
        await ctx.db.patch(addr._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.addressId, {
      isDefault: true,
      updatedAt: Date.now(),
    });

    return args.addressId;
  },
});
