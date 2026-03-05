import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AdminAuthCtx = Pick<QueryCtx | MutationCtx, "auth" | "db">;

export async function getUserByEmail(
  ctx: AdminAuthCtx,
  email: string,
): Promise<Doc<"users"> | null> {
  return ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
}

export async function getAuthUserOrNull(
  ctx: AdminAuthCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email;
  if (!email) {
    return null;
  }

  return getUserByEmail(ctx, email);
}

export async function requireAuthUser(ctx: AdminAuthCtx): Promise<Doc<"users">> {
  const user = await getAuthUserOrNull(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }

  return user;
}

export async function requireAdmin(
  ctx: AdminAuthCtx,
): Promise<Doc<"users"> & { role: "admin" }> {
  const user = await requireAuthUser(ctx);
  if (user.role !== "admin") {
    throw new ConvexError("Unauthorized: admin access required");
  }

  return user as Doc<"users"> & { role: "admin" };
}
