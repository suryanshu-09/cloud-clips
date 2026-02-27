/**
 * CouponBrowser Component
 * A reusable coupon browser UI component for displaying and managing coupons
 */

import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CouponCard } from '@/components/product/CouponCard';
import { useCoupons, type ICouponWithMeta } from '@/features/payments';

export type CouponCategoryFilter = 'all' | 'services' | 'products';
export type CouponTabType = 'available' | 'saved';

export interface ICouponBrowserProps {
  initialTab?: CouponTabType;
  initialCategory?: CouponCategoryFilter;
  showHeader?: boolean;
  showCodeInput?: boolean;
  onCouponApply?: (code: string) => void;
  compact?: boolean;
}

interface ITabButtonProps {
  label: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
}

function TabButton({ label, isActive, count, onPress }: ITabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 px-4 items-center rounded-lg ${
        isActive ? 'bg-blue-600' : 'bg-gray-100'
      }`}
    >
      <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
      {count > 0 && (
        <Text className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
          {count} {count === 1 ? 'coupon' : 'coupons'}
        </Text>
      )}
    </Pressable>
  );
}

function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-blue-600' : 'bg-white border border-gray-200'
      }`}
    >
      <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function CouponsSkeleton() {
  return (
    <View className="px-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-4">
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

export function CouponBrowser({
  initialTab = 'available',
  initialCategory = 'all',
  showHeader = true,
  showCodeInput = true,
  onCouponApply,
  compact = false,
}: ICouponBrowserProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CouponTabType>(initialTab);
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CouponCategoryFilter>(initialCategory);

  const {
    availableCoupons,
    savedCoupons,
    isLoading,
    isRefetching,
    refetch,
    saveCoupon,
    removeSavedCoupon,
    isSaving,
    isRemoving,
  } = useCoupons();

  const filteredCoupons = useMemo(() => {
    const coupons = activeTab === 'available' ? availableCoupons : savedCoupons;

    if (filterCategory === 'all') {
      return coupons;
    }

    return coupons.filter((coupon) => coupon.applicableCategories?.includes(filterCategory));
  }, [availableCoupons, savedCoupons, activeTab, filterCategory]);

  const handleApplyCode = useCallback(async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setIsApplying(true);

    const matchingCoupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase()
    );

    if (matchingCoupon) {
      if (onCouponApply) {
        onCouponApply(matchingCoupon.code);
      } else {
        Alert.alert('Coupon Found!', `${matchingCoupon.description || 'This coupon is valid.'}`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply to Booking',
            onPress: () => {
              router.push({
                pathname: '/search',
                params: { couponCode: matchingCoupon.code },
              });
            },
          },
        ]);
      }
    } else {
      Alert.alert('Invalid Code', 'This coupon code is not valid or has expired.');
    }

    setIsApplying(false);
    setCouponCode('');
  }, [couponCode, availableCoupons, router, onCouponApply]);

  const handleApplyCoupon = useCallback(
    (code: string) => {
      if (onCouponApply) {
        onCouponApply(code);
      } else {
        Alert.alert('Apply Coupon', `Use code "${code}" on your next booking or purchase?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply to Booking',
            onPress: () => {
              router.push({
                pathname: '/search',
                params: { couponCode: code },
              });
            },
          },
          {
            text: 'Apply to Products',
            onPress: () => {
              router.push({
                pathname: '/products',
                params: { couponCode: code },
              });
            },
          },
        ]);
      }
    },
    [router, onCouponApply]
  );

  const handleSaveCoupon = useCallback(
    (couponId: string) => {
      saveCoupon(couponId);
      Alert.alert('Saved!', 'Coupon has been saved to your collection.');
    },
    [saveCoupon]
  );

  const handleRemoveCoupon = useCallback(
    (couponId: string) => {
      Alert.alert('Remove Coupon', 'Are you sure you want to remove this saved coupon?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeSavedCoupon(couponId),
        },
      ]);
    },
    [removeSavedCoupon]
  );

  const renderCoupon = useCallback(
    ({ item }: { item: ICouponWithMeta }) => (
      <View className="px-4 mb-4">
        <CouponCard
          coupon={item}
          onApply={handleApplyCoupon}
          onSave={activeTab === 'available' ? handleSaveCoupon : undefined}
          onRemove={activeTab === 'saved' ? handleRemoveCoupon : undefined}
          isLoading={isSaving || isRemoving}
        />
      </View>
    ),
    [activeTab, handleApplyCoupon, handleSaveCoupon, handleRemoveCoupon, isSaving, isRemoving]
  );

  const emptyStateConfig = {
    available: {
      icon: '🎟️',
      title: 'No Coupons Available',
      description: 'Check back later for new offers and discounts.',
    },
    saved: {
      icon: '📭',
      title: 'No Saved Coupons',
      description: 'Save coupons to easily find them later.',
    },
  };

  const currentEmptyState = emptyStateConfig[activeTab];

  if (compact) {
    return (
      <View className="flex-1">
        {filteredCoupons.length === 0 ? (
          <EmptyState
            icon={currentEmptyState.icon}
            title={currentEmptyState.title}
            description={currentEmptyState.description}
          />
        ) : (
          <FlatList
            data={filteredCoupons}
            renderItem={renderCoupon}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {showHeader && (
        <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Coupons & Offers</Text>
          <Text className="text-gray-600 text-sm">Save on your next appointment or purchase</Text>
        </View>
      )}

      {showCodeInput && (
        <View className="px-4 py-4 bg-white border-b border-gray-100">
          <Text className="text-sm font-medium text-gray-700 mb-2">Have a coupon code?</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApplyCode}
              />
            </View>
            <Button
              variant="primary"
              onPress={handleApplyCode}
              loading={isApplying}
              disabled={!couponCode.trim() || isApplying}
            >
              Apply
            </Button>
          </View>
        </View>
      )}

      <View className="flex-row gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <TabButton
          label="Available"
          isActive={activeTab === 'available'}
          count={availableCoupons.length}
          onPress={() => setActiveTab('available')}
        />
        <TabButton
          label="Saved"
          isActive={activeTab === 'saved'}
          count={savedCoupons.length}
          onPress={() => setActiveTab('saved')}
        />
      </View>

      <View className="flex-row gap-2 px-4 py-3 bg-gray-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            isActive={filterCategory === 'all'}
            onPress={() => setFilterCategory('all')}
          />
          <FilterChip
            label="Services"
            isActive={filterCategory === 'services'}
            onPress={() => setFilterCategory('services')}
          />
          <FilterChip
            label="Products"
            isActive={filterCategory === 'products'}
            onPress={() => setFilterCategory('products')}
          />
        </ScrollView>
      </View>

      {isLoading ? (
        <CouponsSkeleton />
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon={currentEmptyState.icon}
          title={currentEmptyState.title}
          description={currentEmptyState.description}
        />
      ) : (
        <FlatList
          data={filteredCoupons}
          renderItem={renderCoupon}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </View>
  );
}
