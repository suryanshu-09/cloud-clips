import { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { NotificationCard } from './NotificationCard';
import type { INotification } from '@/features/notifications/types';

// Estimated item height for getItemLayout optimization
const ITEM_HEIGHT = 80;

interface INotificationListProps {
  notifications: INotification[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onNotificationPress?: (notification: INotification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  emptyMessage?: string;
}

/**
 * NotificationList - Optimized FlatList for displaying notifications
 *
 * Performance optimizations:
 * - getItemLayout for faster scroll performance
 * - Memoized renderItem callback
 * - removeClippedSubviews for memory efficiency
 * - initialNumToRender for faster initial load
 * - maxToRenderPerBatch and windowSize for smooth scrolling
 */
export function NotificationList({
  notifications,
  isLoading = false,
  isRefreshing = false,
  hasMore = false,
  onRefresh,
  onLoadMore,
  onNotificationPress,
  onMarkAsRead,
  onDelete,
  emptyMessage = 'No notifications yet',
}: INotificationListProps) {
  // Memoized key extractor
  const keyExtractor = useCallback((item: INotification) => item.id, []);

  // Memoized render item function
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<INotification>) => (
      <NotificationCard
        notification={item}
        onPress={onNotificationPress}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
      />
    ),
    [onNotificationPress, onMarkAsRead, onDelete]
  );

  // Memoized getItemLayout for fixed height items
  const getItemLayout = useCallback(
    (_: ArrayLike<INotification> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoized empty component
  const renderEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">🔔</Text>
        <Text className="text-gray-500 text-base">{emptyMessage}</Text>
      </View>
    );
  }, [isLoading, emptyMessage]);

  // Memoized footer component
  const renderFooter = useMemo(() => {
    if (!hasMore || !isLoading) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }, [hasMore, isLoading]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () =>
      onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined,
    [onRefresh, isRefreshing]
  );

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      contentContainerClassName="px-4 py-4"
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={refreshControl}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      // Performance optimizations
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      updateCellsBatchingPeriod={50}
    />
  );
}
