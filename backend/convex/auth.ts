import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "@convex-dev/auth/providers/Resend";
import { Google } from "@convex-dev/auth/providers/Google";
import { Apple } from "@convex-dev/auth/providers/Apple";

/**
 * Convex Auth Configuration
 * 
 * Authentication methods:
 * - Magic Links (via Resend email)
 * - Google OAuth
 * - Apple Sign In
 * 
 * Environment variables required:
 * - RESEND_API_KEY (for magic links)
 * - AUTH_GOOGLE_ID
 * - AUTH_GOOGLE_SECRET
 * - AUTH_APPLE_ID
 * - AUTH_APPLE_SECRET
 */

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Magic Links via Resend
    ResendOTP({
      id: "resend-otp",
      apiKey: process.env.RESEND_API_KEY!,
      from: "Cloud Clips <auth@cloudclips.app>",
    }),
    
    // Google OAuth
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    
    // Apple Sign In
    Apple({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
  ],
  
  // Callbacks
  callbacks: {
    // Called when a user signs in
    async createUser(ctx, userId, account) {
      // Initialize user with default role
      await ctx.db.insert("users", {
        _id: userId,
        email: account.email,
        emailVerified: account.emailVerified,
        role: "client", // Default role
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  },
});
