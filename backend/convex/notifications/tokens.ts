import { mutation, action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "../_generated/api";

/**
 * Push Token Management
 *
 * Mutations for registering/unregistering Expo push tokens
 * and an internal action for sending push notifications via Expo's Push API.
 */

/**
 * Register a push token for the current user
 * Adds the token to the user's pushTokens array (avoids duplicates)
 */
export const registerPushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const currentTokens = user.pushTokens || [];

    // Avoid duplicate tokens
    if (currentTokens.includes(args.token)) {
      return { success: true, message: "Token already registered" };
    }

    await ctx.db.patch(user._id, {
      pushTokens: [...currentTokens, args.token],
      updatedAt: Date.now(),
    });

    return { success: true, message: "Token registered" };
  },
});

/**
 * Unregister a push token for the current user
 * Removes the token from the user's pushTokens array
 */
export const unregisterPushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const currentTokens = user.pushTokens || [];

    await ctx.db.patch(user._id, {
      pushTokens: currentTokens.filter((t) => t !== args.token),
      updatedAt: Date.now(),
    });

    return { success: true, message: "Token unregistered" };
  },
});

/**
 * Send a push notification to a user via Expo Push API
 *
 * This is an action (not a mutation) because it makes external HTTP calls
 * to the Expo push notification service.
 */
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    | { success: false; error: string }
    | { success: true; sent: number; message: string }
    | {
        success: true;
        sent: number;
        failed: number;
        invalidTokensRemoved: number;
      }
  > => {
    // Get user's push tokens
    const user: { pushTokens?: string[] } | null = await ctx.runQuery(
      api.users.queries.getUserById,
      {
      userId: args.userId,
      }
    );

    if (!user) {
      console.error(`sendPushNotification: User ${args.userId} not found`);
      return { success: false, error: "User not found" };
    }

    const pushTokens: string[] = user.pushTokens ?? [];

    if (pushTokens.length === 0) {
      return { success: true, sent: 0, message: "No push tokens registered" };
    }

    // Build Expo push messages for all tokens
    const messages: Array<{
      to: string;
      sound: "default";
      title: string;
      body: string;
      data: Record<string, string>;
    }> = pushTokens.map((token: string) => ({
      to: token,
      sound: "default" as const,
      title: args.title,
      body: args.body,
      data: args.data || {},
    }));

    try {
      // Send via Expo Push API
      const response: Response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Expo Push API error: ${response.status} - ${errorText}`);
        return { success: false, error: `Push API error: ${response.status}` };
      }

      const result: { data?: Array<{ status: string; message?: string; details?: { error?: string } }> } = await response.json();
      const tickets = result.data || [];

      // Collect invalid tokens to remove
      const invalidTokens: string[] = [];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];

        if (ticket.status === "error") {
          console.error(
            `Push notification error for token ${pushTokens[i]}: ${ticket.message}`
          );

          // Remove tokens that are invalid or have device-not-registered errors
          if (
            ticket.details?.error === "DeviceNotRegistered" ||
            ticket.details?.error === "InvalidCredentials"
          ) {
            invalidTokens.push(pushTokens[i]);
          }
        }
      }

      // Remove invalid tokens from the user's record
      if (invalidTokens.length > 0) {
        const remainingTokens = pushTokens.filter(
          (t: string) => !invalidTokens.includes(t)
        );

        await ctx.runMutation(
          api.notifications.tokens.updateUserPushTokens,
          {
            userId: args.userId,
            tokens: remainingTokens,
          }
        );

        console.log(
          `Removed ${invalidTokens.length} invalid push token(s) for user ${args.userId}`
        );
      }

      const successCount = tickets.filter(
        (t: { status: string }) => t.status === "ok"
      ).length;

      return {
        success: true,
        sent: successCount,
        failed: tickets.length - successCount,
        invalidTokensRemoved: invalidTokens.length,
      };
    } catch (error: any) {
      console.error(`Failed to send push notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Internal mutation to update a user's push tokens
 * Used by sendPushNotification to remove invalid tokens
 */
export const updateUserPushTokens = mutation({
  args: {
    userId: v.id("users"),
    tokens: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pushTokens: args.tokens,
      updatedAt: Date.now(),
    });
  },
});
