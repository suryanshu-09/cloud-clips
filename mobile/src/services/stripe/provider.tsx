/**
 * Stripe Provider Component
 * Wraps the app with StripeProvider for payment functionality
 */

import { ReactNode } from 'react';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface IStripeProviderProps {
  children: ReactNode;
}

/**
 * StripeProviderWrapper
 *
 * Wraps the application with Stripe's provider component.
 * Must be placed near the root of the app, below any state providers.
 *
 * Required environment variables:
 * - EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key (pk_test_... or pk_live_...)
 *
 * @example
 * ```tsx
 * <JotaiProvider>
 *   <QueryClientProvider client={queryClient}>
 *     <StripeProviderWrapper>
 *       <App />
 *     </StripeProviderWrapper>
 *   </QueryClientProvider>
 * </JotaiProvider>
 * ```
 */
export function StripeProviderWrapper({ children }: IStripeProviderProps) {
  // If no publishable key is configured, just render children without Stripe
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn(
      '[Stripe] No publishable key found. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.',
      'Stripe functionality will be disabled.'
    );
    return <>{children}</>;
  }

  return (
    <NativeStripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.cloudclips"
      urlScheme="cloudclips"
    >
      {children}
    </NativeStripeProvider>
  );
}

/**
 * Check if Stripe is configured and ready to use
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_PUBLISHABLE_KEY;
}

export default StripeProviderWrapper;
