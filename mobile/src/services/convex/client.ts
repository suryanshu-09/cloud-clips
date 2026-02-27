/**
 * Convex Client Configuration
 *
 * Initializes the ConvexReactClient for real-time backend communication.
 * Reads the deployment URL from EXPO_PUBLIC_CONVEX_URL environment variable.
 */

import { ConvexReactClient } from 'convex/react';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';

if (!CONVEX_URL) {
  console.warn(
    '[Convex] No deployment URL found. Set EXPO_PUBLIC_CONVEX_URL in your .env file.',
    'Convex functionality will be disabled.'
  );
}

export const convex = new ConvexReactClient(CONVEX_URL);
