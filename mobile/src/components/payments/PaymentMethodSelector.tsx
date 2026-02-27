/**
 * PaymentMethodSelector Component
 * Reusable component for selecting payment methods (saved cards, new card, platform pay)
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { IPaymentMethod } from '@/features/payments/types';

// Card brand display mapping
const CARD_BRAND_DISPLAY: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

// Card brand icons (using text-based representations)
const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'V',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'D',
  diners: 'DC',
  jcb: 'JCB',
  unionpay: 'UP',
  unknown: '💳',
};

export interface IPaymentMethodSelectorProps {
  savedCards: IPaymentMethod[];
  isLoading: boolean;
  isConfigured: boolean;
  isPlatformPayAvailable: boolean;
  selectedCardId: string | null;
  onSelectCard: (cardId: string | null) => void;
  onPlatformPay?: () => void;
  disabled?: boolean;
  showPlatformPay?: boolean;
  testID?: string;
}

export function PaymentMethodSelector({
  savedCards,
  isLoading,
  isConfigured,
  isPlatformPayAvailable,
  selectedCardId,
  onSelectCard,
  onPlatformPay,
  disabled = false,
  showPlatformPay = true,
  testID,
}: IPaymentMethodSelectorProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedCardId);

  useEffect(() => {
    setLocalSelectedId(selectedCardId);
  }, [selectedCardId]);

  const handleSelectCard = (cardId: string | null) => {
    setLocalSelectedId(cardId);
    onSelectCard(cardId);
  };

  if (isLoading) {
    return (
      <Card style={styles.container} testID={testID}>
        <Text style={styles.title}>Payment Method</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading payment options...</Text>
        </View>
      </Card>
    );
  }

  if (!isConfigured) {
    return (
      <Card style={styles.container} testID={testID}>
        <Text style={styles.title}>Payment Method</Text>
        <View style={styles.devModeContainer}>
          <Text style={styles.devModeTitle}>Development Mode</Text>
          <Text style={styles.devModeText}>
            Payment processing is disabled. Booking will proceed without payment.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container} testID={testID}>
      <Text style={styles.title}>Payment Method</Text>

      {/* Saved Cards */}
      {savedCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Cards</Text>
          {savedCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleSelectCard(card.id)}
              disabled={disabled}
              style={[styles.cardOption, localSelectedId === card.id && styles.cardOptionSelected]}
              testID={`${testID}-card-${card.id}`}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>
                  {CARD_BRAND_ICONS[card.card?.brand || 'unknown']}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>
                  {CARD_BRAND_DISPLAY[card.card?.brand || 'unknown']} •••• {card.card?.last4}
                </Text>
                <Text style={styles.cardExpiry}>
                  Expires {card.card?.expiryMonth}/{card.card?.expiryYear}
                </Text>
              </View>
              {card.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
              {localSelectedId === card.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add New Card Option */}
      <TouchableOpacity
        onPress={() => handleSelectCard(null)}
        disabled={disabled}
        style={[styles.cardOption, localSelectedId === null && styles.cardOptionSelected]}
        testID={`${testID}-new-card`}
      >
        <View style={[styles.cardIconContainer, styles.addCardIcon]}>
          <Text style={styles.addCardIconText}>+</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>Add New Card</Text>
          <Text style={styles.cardExpiry}>Pay with a new card</Text>
        </View>
        {localSelectedId === null && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Platform Pay Options */}
      {showPlatformPay && isPlatformPayAvailable && (
        <View style={styles.platformPaySection}>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Express Checkout</Text>
          <Button
            variant="outline"
            onPress={onPlatformPay}
            disabled={disabled}
            style={styles.platformPayButton}
            testID={`${testID}-platform-pay`}
          >
            Pay with Apple Pay / Google Pay
          </Button>
        </View>
      )}

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>Your payment information is secured with Stripe</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  devModeContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  devModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  devModeText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  cardOptionSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  cardIconContainer: {
    width: 40,
    height: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  addCardIcon: {
    backgroundColor: '#E5E7EB',
  },
  addCardIconText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  cardExpiry: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  platformPaySection: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  platformPayButton: {
    marginTop: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
