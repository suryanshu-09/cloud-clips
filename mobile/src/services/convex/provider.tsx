/**
 * Convex Provider Component
 *
 * Wraps the app with ConvexProvider for real-time backend communication.
 * Must be placed near the root of the app.
 */

import { ReactNode } from 'react';
import { ConvexProvider as NativeConvexProvider } from 'convex/react';
import { convex } from './client';

interface IConvexProviderProps {
  children: ReactNode;
}

export function ConvexProviderWrapper({ children }: IConvexProviderProps) {
  return <NativeConvexProvider client={convex}>{children}</NativeConvexProvider>;
}

export default ConvexProviderWrapper;
