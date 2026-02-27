import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * User Mutations
 * 
 * Mutations for updating user data with comprehensive validation
 */

// Validation constants
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_PHONE_LENGTH = 20;
const MAX_AVATAR_URL_LENGTH = 2000;

/**
 * Validates a name string
 * - Must be between MIN_NAME_LENGTH and MAX_NAME_LENGTH characters
 * - Cannot contain only whitespace
 * - Cannot contain special characters except spaces, hyphens, and apostrophes
 */
function validateName(name: string): void {
  const trimmedName = name.trim();
  
  if (trimmedName.length < MIN_NAME_LENGTH) {
    throw new ConvexError(`Name must be at least ${MIN_NAME_LENGTH} characters`);
  }
  
  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw new ConvexError(`Name must not exceed ${MAX_NAME_LENGTH} characters`);
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and accented characters
  const validNameRegex = /^[\p{L}\s'-]+$/u;
  if (!validNameRegex.test(trimmedName)) {
    throw new ConvexError("Name can only contain letters, spaces, hyphens, and apostrophes");
  }
}

/**
 * Validates a phone number
 * - Must be a valid international or local format
 * - Supports formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
function validatePhone(phone: string): void {
  if (phone.length > MAX_PHONE_LENGTH) {
    throw new ConvexError(`Phone number must not exceed ${MAX_PHONE_LENGTH} characters`);
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Must have at least 7 digits (local number) and max 15 (international)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new ConvexError("Phone number must contain between 7 and 15 digits");
  }
  
  // Basic phone format regex (allows common formats)
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]+$/;
  if (!phoneRegex.test(phone)) {
    throw new ConvexError("Invalid phone number format");
  }
}

/**
 * Validates an avatar URL
 * - Must be a valid URL
 * - Must be http or https protocol
 * - Must not exceed maximum length
 */
function validateAvatarUrl(url: string): void {
  if (url.length > MAX_AVATAR_URL_LENGTH) {
    throw new ConvexError(`Avatar URL must not exceed ${MAX_AVATAR_URL_LENGTH} characters`);
  }
  
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      throw new ConvexError("Avatar URL must use HTTP or HTTPS protocol");
    }
  } catch {
    throw new ConvexError("Invalid avatar URL format");
  }
}

/**
 * Update the current user's profile
 * Validates all inputs before updating
 * 
 * @param name - User's display name (2-100 chars, letters/spaces/hyphens/apostrophes only)
 * @param phone - Phone number (7-15 digits, various formats supported)
 * @param avatar - Avatar image URL (must be valid http/https URL)
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Validate inputs
    const updates: Partial<{
      name: string;
      phone: string;
      avatar: string;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      validateName(args.name);
      updates.name = args.name.trim();
    }

    if (args.phone !== undefined) {
      validatePhone(args.phone);
      updates.phone = args.phone.trim();
    }

    if (args.avatar !== undefined) {
      validateAvatarUrl(args.avatar);
      updates.avatar = args.avatar.trim();
    }

    // Update user
    await ctx.db.patch(user._id, updates);

    // Return updated user
    const updatedUser = await ctx.db.get(user._id);
    if (!updatedUser) {
      throw new ConvexError("Failed to retrieve updated user");
    }

    return {
      _id: updatedUser._id,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
      name: updatedUser.name,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
    };
  },
});

// Update push tokens
export const updatePushToken = mutation({
  args: {
    token: v.string(),
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

    const currentTokens = user.pushTokens || [];
    if (!currentTokens.includes(args.token)) {
      await ctx.db.patch(user._id, {
        pushTokens: [...currentTokens, args.token],
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(user._id);
  },
});

// Remove push token
export const removePushToken = mutation({
  args: {
    token: v.string(),
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

    const currentTokens = user.pushTokens || [];
    await ctx.db.patch(user._id, {
      pushTokens: currentTokens.filter((t) => t !== args.token),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});
