type IIdentityWithOptionalEmail = {
  email?: string | null;
};

export function requireIdentityEmail(
  identity: IIdentityWithOptionalEmail | null,
): string {
  const email = identity?.email;
  if (!email) {
    throw new Error("Authenticated identity is missing an email");
  }

  return email;
}
