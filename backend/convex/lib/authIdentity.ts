type IIdentityWithOptionalEmail = {
  email?: string | null;
};

const DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === "true";
const DEV_BYPASS_EMAIL = process.env.DEV_BYPASS_EMAIL ?? "demo.client@cloudclips.dev";

export async function getIdentityOrDev(
  ctx: { auth: { getUserIdentity: () => Promise<IIdentityWithOptionalEmail | null> } },
): Promise<IIdentityWithOptionalEmail> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return identity;
  }

  if (DEV_BYPASS_AUTH) {
    return { email: DEV_BYPASS_EMAIL };
  }

  throw new Error("Not authenticated");
}

export function requireIdentityEmail(
  identity: IIdentityWithOptionalEmail | null,
): string {
  const email = identity?.email;
  if (!email) {
    throw new Error("Authenticated identity is missing an email");
  }

  return email;
}
