import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import Google from "@auth/core/providers/google";
import Apple from "@auth/core/providers/apple";

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
 * - AUTH_EMAIL_FROM (sender email address)
 * - AUTH_GOOGLE_ID
 * - AUTH_GOOGLE_SECRET
 * - AUTH_APPLE_ID
 * - AUTH_APPLE_SECRET
 * - AUTH_APPLE_TEAM_ID
 * - AUTH_APPLE_KEY_ID
 */

const authConfig: any = convexAuth({
  providers: [
    // Magic Links via Resend email
    Email({
      id: "resend-magic-link",
      // Enable magic link behavior (only token needed, no email verification required)
      authorize: undefined,
      // Use Resend to send magic links
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from || "Cloud Clips <auth@cloudclips.app>",
            to: email,
            subject: "Sign in to Cloud Clips",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Sign in to Cloud Clips</h1>
                <p>Click the link below to sign in:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                  Sign In
                </a>
                <p style="color: #666; font-size: 14px;">
                  Or copy and paste this URL into your browser:<br>
                  <code style="background: #f5f5f5; padding: 4px; border-radius: 4px;">${url}</code>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">
                  This link will expire in 24 hours.
                </p>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to send email: ${error}`);
        }
      },
      from: process.env.AUTH_EMAIL_FROM || "Cloud Clips <auth@cloudclips.app>",
      maxAge: 24 * 60 * 60, // 24 hours
    }),

    // Google OAuth
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Apple Sign In
    Apple({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
});

export const { auth, signIn, signOut, store } = authConfig;
