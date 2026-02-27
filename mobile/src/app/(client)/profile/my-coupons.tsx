import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { CouponCard } from '@/components/product/CouponCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useCoupons, type ICouponWithMeta } from '@/features/payments';

type FilterType = 'all' | 'services' | 'products';

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
    <Text
      onPress={onPress}
      className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
    </Text>
  );
}

export default function MyCouponsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const { savedCoupons, isLoading, isRefetching, refetch, removeSavedCoupon, isRemoving } =
    useCoupons();

  const filteredCoupons = useMemo(() => {
    if (filter === 'all') {
      return savedCoupons;
    }
    return savedCoupons.filter((coupon) => coupon.applicableCategories?.includes(filter));
  }, [savedCoupons, filter]);

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

  const handleApplyCoupon = useCallback(
    (code: string) => {
      Alert.alert('Apply Coupon', `Use code "${code}" on your next booking or purchase?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Appointment',
          onPress: () => {
            router.push({
              pathname: '/search',
              params: { couponCode: code },
            });
          },
        },
        {
          text: 'Shop Products',
          onPress: () => {
            router.push({
              pathname: '/store',
              params: { couponCode: code },
            });
          },
        },
      ]);
    },
    [router]
  );

  const renderCoupon = useCallback(
    ({ item }: { item: ICouponWithMeta }) => (
      <View className="px-4 mb-4">
        <CouponCard
          coupon={item}
          onApply={handleApplyCoupon}
          onRemove={handleRemoveCoupon}
          isLoading={isRemoving}
        />
      </View>
    ),
    [handleApplyCoupon, handleRemoveCoupon, isRemoving]
  );

  const stats = useMemo(() => {
    const services = savedCoupons.filter((c) =>
      c.applicableCategories?.includes('services')
    ).length;
    const products = savedCoupons.filter((c) =>
      c.applicableCategories?.includes('products')
    ).length;
    return { total: savedCoupons.length, services, products };
  }, [savedCoupons]);

  return (
    <SafeView className="flex-1 bg-gray-50">
      <Header title="My Coupons" showBack />

      {/* Stats Banner */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">{stats.total}</Text>
            <Text className="text-blue-200 text-sm">Saved</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">{stats.services}</Text>
            <Text className="text-blue-200 text-sm">For Services</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">{stats.products}</Text>
            <Text className="text-blue-200 text-sm">For Products</Text>
          </View>
        </View>
      </View>

      {/* Filter */}
      <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
        <FilterChip label="All" isActive={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip
          label="Services"
          isActive={filter === 'services'}
          onPress={() => setFilter('services')}
        />
        <FilterChip
          label="Products"
          isActive={filter === 'products'}
          onPress={() => setFilter('products')}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <CouponsSkeleton />
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No Saved Coupons"
          description={
            filter === 'all'
              ? 'Save coupons from the offers page to see them here.'
              : `No ${filter} coupons saved yet.`
          }
          actionLabel="Browse Offers"
          onAction={() => router.push('/(client)/coupons')}
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
    </SafeView>
  );
}
