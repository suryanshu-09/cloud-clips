import { useCallback, useMemo } from 'react';
import { View, FlatList, Text, ActivityIndicator, type ListRenderItemInfo } from 'react-native';
import { BarberCard } from './BarberCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { IBarberProfile } from '@/features/barbers';

// Estimated item height for getItemLayout optimization
const ITEM_HEIGHT = 160;
const ITEM_MARGIN = 12;

interface IBarberListProps {
  barbers: IBarberProfile[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onBarberPress?: (barber: IBarberProfile) => void;
  onRetry?: () => void;
  showDistance?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/**
 * BarberList - Optimized FlatList for displaying barber cards
 *
 * Performance optimizations:
 * - getItemLayout for faster scroll performance
 * - Memoized renderItem callback
 * - removeClippedSubviews for memory efficiency
 * - initialNumToRender for faster initial load
 * - maxToRenderPerBatch and windowSize for smooth scrolling
 */
export function BarberList({
  barbers,
  isLoading = false,
  isError = false,
  error = null,
  onBarberPress,
  onRetry,
  showDistance = false,
  ListHeaderComponent,
  ListFooterComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing = false,
  onRefresh,
}: IBarberListProps) {
  // Memoized key extractor
  const keyExtractor = useCallback((item: IBarberProfile) => item.id, []);

  // Memoized render item function
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IBarberProfile>) => (
      <View className="px-4 mb-3">
        <BarberCard
          barber={item}
          showDistance={showDistance}
          onPress={() => onBarberPress?.(item)}
        />
      </View>
    ),
    [showDistance, onBarberPress]
  );

  // Memoized getItemLayout for fixed height items
  const getItemLayout = useCallback(
    (_: ArrayLike<IBarberProfile> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT + ITEM_MARGIN,
      offset: (ITEM_HEIGHT + ITEM_MARGIN) * index,
      index,
    }),
    []
  );

  // Memoized footer component
  const renderFooter = useMemo(() => {
    if (ListFooterComponent) return ListFooterComponent;
    if (isLoading) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#0066CC" />
        </View>
      );
    }
    return null;
  }, [ListFooterComponent, isLoading]);

  // Loading state
  if (isLoading && barbers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#0066CC" />
        <Text className="text-gray-600 mt-4">Finding barbers near you...</Text>
      </View>
    );
  }

  // Error state
  if (isError && barbers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          title="Failed to load barbers"
          description={error?.message || 'Something went wrong. Please try again.'}
        />
        {onRetry && (
          <Button onPress={onRetry} className="mt-4">
            Try Again
          </Button>
        )}
      </View>
    );
  }

  // Empty state
  if (barbers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          title="No barbers found"
          description="Try adjusting your search filters or location"
        />
      </View>
    );
  }

  return (
    <FlatList
      data={barbers}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={5}
      updateCellsBatchingPeriod={50}
    />
  );
}
