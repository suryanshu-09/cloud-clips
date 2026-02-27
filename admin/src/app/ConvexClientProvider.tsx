"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "@/lib/convex";

const convex = new ConvexReactClient(CONVEX_URL);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
