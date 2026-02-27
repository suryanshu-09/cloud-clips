import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { IPaymentResult } from '@/features/payments/services/stripeService';

export interface IPaymentSheetProps {
  clientSecret: string;
  merchantDisplayName?: string;
  amount: number;
  currency?: string;
  onPaymentSuccess?: (result: IPaymentResult) => void;
  onPaymentError?: (error: { code: string; message: string }) => void;
  onPaymentCancel?: () => void;
  buttonText?: string;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

interface IPaymentSheetState {
  isInitializing: boolean;
  isPresenting: boolean;
  error: string | null;
}

export function PaymentSheet({
  clientSecret,
  merchantDisplayName = 'Cloud Clips',
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  buttonText,
  disabled = false,
  loading = false,
  testID,
}: IPaymentSheetProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [state, setState] = useState<IPaymentSheetState>({
    isInitializing: false,
    isPresenting: false,
    error: null,
  });

  const formatAmount = useCallback(() => {
    return `${currency === 'USD' ? '$' : currency}${(amount / 100).toFixed(2)}`;
  }, [amount, currency]);

  const initializeAndPresentPaymentSheet = useCallback(async () => {
    if (!clientSecret) {
      setState((prev) => ({ ...prev, error: 'Payment configuration error' }));
      onPaymentError?.({
        code: 'configuration_error',
        message: 'Payment configuration is missing',
      });
      return;
    }

    setState({
      isInitializing: true,
      isPresenting: false,
      error: null,
    });

    try {
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName,
        style: 'automatic',
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
          currencyCode: currency,
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        returnURL: 'cloudclips://payment-complete',
        allowsDelayedPaymentMethods: false,
        primaryButtonLabel: `Pay ${formatAmount()}`,
      });

      if (initError) {
        console.error('[PaymentSheet] Initialization error:', initError);
        setState({
          isInitializing: false,
          isPresenting: false,
          error: initError.message,
        });
        onPaymentError?.({
          code: initError.code || 'initialization_error',
          message: initError.message,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        isInitializing: false,
        isPresenting: true,
      }));

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === PaymentSheetError.Canceled) {
          setState({
            isInitializing: false,
            isPresenting: false,
            error: null,
          });
          onPaymentCancel?.();
          return;
        }

        console.error('[PaymentSheet] Presentation error:', presentError);
        setState({
          isInitializing: false,
          isPresenting: false,
          error: presentError.message,
        });
        onPaymentError?.({
          code: presentError.code || 'presentation_error',
          message: presentError.message,
        });
        return;
      }

      setState({
        isInitializing: false,
        isPresenting: false,
        error: null,
      });

      const result: IPaymentResult = {
        success: true,
      };

      onPaymentSuccess?.(result);
    } catch (error) {
      const err = error as Error;
      console.error('[PaymentSheet] Unexpected error:', err);
      setState({
        isInitializing: false,
        isPresenting: false,
        error: err.message || 'An unexpected error occurred',
      });
      onPaymentError?.({
        code: 'unknown_error',
        message: err.message || 'An unexpected error occurred',
      });
    }
  }, [
    clientSecret,
    merchantDisplayName,
    currency,
    formatAmount,
    initPaymentSheet,
    presentPaymentSheet,
    onPaymentSuccess,
    onPaymentError,
    onPaymentCancel,
  ]);

  const isBusy = state.isInitializing || state.isPresenting || loading;
  const displayButtonText = buttonText || `Pay ${formatAmount()}`;

  return (
    <View style={styles.container} testID={testID}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Secure Payment</Text>
            <Text style={styles.subtitle}>Your payment is secured with Stripe</Text>
          </View>

          {state.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          <View style={styles.securityInfo}>
            <View style={styles.securityRow}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>PCI DSS Level 1 Compliant</Text>
            </View>
            <View style={styles.securityRow}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>3D Secure Authentication</Text>
            </View>
            <View style={styles.securityRow}>
              <Text style={styles.securityIcon}>🔐</Text>
              <Text style={styles.securityText}>End-to-End Encryption</Text>
            </View>
          </View>

          <Button
            onPress={initializeAndPresentPaymentSheet}
            disabled={disabled || isBusy || !clientSecret}
            loading={isBusy}
            size="lg"
            fullWidth
            testID={`${testID}-button`}
          >
            {displayButtonText}
          </Button>

          {__DEV__ && (
            <View style={styles.testInfo}>
              <Text style={styles.testInfoTitle}>Test Cards</Text>
              <Text style={styles.testInfoText}>
                Success: 4242 4242 4242 4242{'\n'}
                3D Secure: 4000 0027 6000 3184{'\n'}
                Decline: 4000 0000 0000 0002{'\n'}
                Exp: Any future date | CVC: Any 3 digits
              </Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  securityInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#166534',
  },
  testInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  testInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  testInfoText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
});
