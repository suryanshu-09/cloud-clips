/**
 * CouponCard Component
 * Displays a coupon with discount details and actions
 */

import { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DiscountType } from '@/features/payments/types';
import type { ICouponWithMeta } from '@/features/payments/hooks/useCoupons';

interface ICouponCardProps {
  coupon: ICouponWithMeta;
  onApply?: (code: string) => void;
  onSave?: (couponId: string) => void;
  onRemove?: (couponId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

/**
 * Format expiry date to readable string
 */
function formatExpiryDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Expired';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else if (diffDays <= 7) {
    return `Expires in ${diffDays} days`;
  } else {
    return `Valid until ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
}

/**
 * Get discount display string
 */
function getDiscountDisplay(coupon: ICouponWithMeta): string {
  if (coupon.discountType === DiscountType.PERCENTAGE) {
    return `${coupon.discountValue}% OFF`;
  }
  return `$${coupon.discountValue} OFF`;
}

/**
 * Get usage display
 */
function getUsageDisplay(coupon: ICouponWithMeta): string | null {
  if (!coupon.usageLimit) return null;
  const remaining = coupon.usageLimit - coupon.usageCount;
  if (remaining <= 10) {
    return `Only ${remaining} left!`;
  }
  return null;
}

/**
 * Check if coupon is expiring soon (within 3 days)
 */
function isExpiringSoon(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays > 0;
}

function CouponCardComponent({
  coupon,
  onApply,
  onSave,
  onRemove,
  isLoading = false,
  showActions = true,
}: ICouponCardProps) {
  const discountDisplay = useMemo(() => getDiscountDisplay(coupon), [coupon]);
  const expiryDisplay = useMemo(
    () => (coupon.expiresAt ? formatExpiryDate(coupon.expiresAt) : null),
    [coupon.expiresAt]
  );
  const usageDisplay = useMemo(() => getUsageDisplay(coupon), [coupon]);
  const expiringSoon = useMemo(() => isExpiringSoon(coupon.expiresAt), [coupon.expiresAt]);

  const handleCopyCode = useCallback(async () => {
    Alert.alert('Coupon Code', `Code "${coupon.code}" ready to use!`);
    // Note: In production, you would use expo-clipboard here:
    // await Clipboard.setStringAsync(coupon.code);
  }, [coupon.code]);

  const handleApply = useCallback(() => {
    onApply?.(coupon.code);
  }, [onApply, coupon.code]);

  const handleSave = useCallback(() => {
    onSave?.(coupon.id);
  }, [onSave, coupon.id]);

  const handleRemove = useCallback(() => {
    onRemove?.(coupon.id);
  }, [onRemove, coupon.id]);

  // Category badges
  const categoryBadges = useMemo(() => {
    if (!coupon.applicableCategories?.length) return null;
    return coupon.applicableCategories.map((cat) => (
      <Badge key={cat} variant="secondary" size="sm">
        {cat === 'services' ? 'Services' : 'Products'}
      </Badge>
    ));
  }, [coupon.applicableCategories]);

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <View className="flex-row">
        {/* Left side - Discount display */}
        <View className="bg-blue-600 p-4 items-center justify-center min-w-[100px]">
          <Text className="text-white text-lg font-bold text-center">{discountDisplay}</Text>
          {coupon.maxDiscount && (
            <Text className="text-blue-200 text-xs mt-1">Max ${coupon.maxDiscount}</Text>
          )}
        </View>

        {/* Right side - Coupon details */}
        <View className="flex-1 p-4">
          {/* Code and Copy button */}
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={handleCopyCode}
              className="flex-row items-center gap-2"
              accessibilityRole="button"
              accessibilityLabel={`Coupon code ${coupon.code}. Tap to copy`}
              accessibilityHint="Copies the coupon code"
            >
              <Text className="text-lg font-bold text-gray-900 tracking-wide">{coupon.code}</Text>
              <Text className="text-gray-400">📋</Text>
            </Pressable>
            {coupon.isSaved && (
              <Badge variant="success" size="sm">
                Saved
              </Badge>
            )}
          </View>

          {/* Description */}
          {coupon.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {coupon.description}
            </Text>
          )}

          {/* Categories and Expiry */}
          <View className="flex-row items-center flex-wrap gap-2 mb-2">
            {categoryBadges}
            {expiryDisplay && (
              <Text
                className={`text-xs ${expiringSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}
              >
                {expiryDisplay}
              </Text>
            )}
            {usageDisplay && (
              <Text className="text-xs text-red-600 font-medium">{usageDisplay}</Text>
            )}
          </View>

          {/* Min amount if applicable */}
          {coupon.minAmount && (
            <Text className="text-xs text-gray-500">Min. order: ${coupon.minAmount}</Text>
          )}
        </View>
      </View>

      {/* Actions */}
      {showActions && (
        <View className="flex-row gap-2 px-4 pb-4 pt-2 border-t border-gray-100">
          {onApply && (
            <View className="flex-1">
              <Button
                variant="primary"
                size="sm"
                onPress={handleApply}
                disabled={isLoading}
                fullWidth
              >
                Apply
              </Button>
            </View>
          )}
          {!coupon.isSaved && onSave && (
            <View className="flex-1">
              <Button
                variant="outline"
                size="sm"
                onPress={handleSave}
                disabled={isLoading}
                fullWidth
              >
                Save
              </Button>
            </View>
          )}
          {coupon.isSaved && onRemove && (
            <View className="flex-1">
              <Button
                variant="outline"
                size="sm"
                onPress={handleRemove}
                disabled={isLoading}
                fullWidth
              >
                Remove
              </Button>
            </View>
          )}
        </View>
      )}

      {/* Terms and Conditions (expandable in future) */}
      {coupon.termsAndConditions && (
        <View className="px-4 pb-3 bg-gray-50">
          <Text className="text-xs text-gray-500">{coupon.termsAndConditions}</Text>
        </View>
      )}
    </Card>
  );
}

export const CouponCard = memo(CouponCardComponent);
