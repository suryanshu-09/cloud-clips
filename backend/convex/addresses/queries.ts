import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Address Queries
 *
 * Queries for fetching user shipping addresses
 */

/**
 * Get all addresses for the current authenticated user
 */
export const getAddresses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return [];
    }

    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return addresses.map((addr) => ({
      id: addr._id,
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      zip: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
      instructions: addr.instructions,
    }));
  },
});

/**
 * Get the default address for the current user
 */
export const getDefaultAddress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return null;
    }

    const address = await ctx.db
      .query("addresses")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", user._id).eq("isDefault", true),
      )
      .first();

    if (!address) {
      return null;
    }

    return {
      id: address._id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      instructions: address.instructions,
    };
  },
});

/**
 * Get a specific address by ID
 */
export const getAddressById = query({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return null;
    }

    const address = await ctx.db.get(args.addressId);

    if (!address || address.userId !== user._id) {
      return null;
    }

    return {
      id: address._id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      instructions: address.instructions,
    };
  },
});
