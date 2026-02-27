import { useCallback, useMemo } from 'react';
import { View, FlatList, Text, ActivityIndicator, type ListRenderItemInfo } from 'react-native';
import { ReviewCard } from './ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { IReview } from '@/features/reviews';

// Estimated item height for getItemLayout optimization
const ITEM_HEIGHT = 200;
const ITEM_MARGIN = 12;

interface IReviewListProps {
  reviews: IReview[];
  isLoading?: boolean;
  isError?: boolean;
  isFetchingNextPage?: boolean;
  error?: Error | null;
  onReviewPress?: (review: IReview) => void;
  onRetry?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  contentContainerStyle?: any;
  showEmptyState?: boolean;
}

/**
 * ReviewList - Optimized FlatList for displaying review cards with pagination
 *
 * Performance optimizations:
 * - getItemLayout for faster scroll performance
 * - Memoized renderItem callback
 * - removeClippedSubviews for memory efficiency
 * - initialNumToRender for faster initial load
 * - maxToRenderPerBatch and windowSize for smooth scrolling
 */
export function ReviewList({
  reviews,
  isLoading = false,
  isError = false,
  isFetchingNextPage = false,
  error = null,
  onReviewPress,
  onRetry,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  showEmptyState = true,
}: IReviewListProps) {
  // Memoized key extractor
  const keyExtractor = useCallback((item: IReview) => item.id, []);

  // Memoized render item function
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IReview>) => (
      <View className="px-4 mb-3">
        <ReviewCard review={item} onMorePress={() => onReviewPress?.(item)} />
      </View>
    ),
    [onReviewPress]
  );

  // Memoized getItemLayout for fixed height items
  const getItemLayout = useCallback(
    (_: ArrayLike<IReview> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT + ITEM_MARGIN,
      offset: (ITEM_HEIGHT + ITEM_MARGIN) * index,
      index,
    }),
    []
  );

  // Memoized footer component - shows loading indicator when fetching next page
  const renderFooter = useMemo(() => {
    if (ListFooterComponent) return ListFooterComponent;
    if (isFetchingNextPage) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#0066CC" />
          <Text className="text-gray-500 text-sm mt-2">Loading more reviews...</Text>
        </View>
      );
    }
    return null;
  }, [ListFooterComponent, isFetchingNextPage]);

  // Loading state - initial load
  if (isLoading && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#0066CC" />
        <Text className="text-gray-600 mt-4">Loading reviews...</Text>
      </View>
    );
  }

  // Error state
  if (isError && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          title="Failed to load reviews"
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
  if (showEmptyState && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <EmptyState
          icon="⭐"
          title="No reviews yet"
          description="Be the first to share your experience!"
        />
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={[{ paddingTop: 12, paddingBottom: 20 }, contentContainerStyle]}
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
