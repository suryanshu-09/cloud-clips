import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { Card } from '@/components/ui';
import { useEarningsHistory, IEarningItem } from '@/features/earnings';
import { useAuth } from '@/features/auth';

// Helper to format currency from cents
const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Earning item component
function EarningItemCard({ item }: { item: IEarningItem }) {
  const [expanded, setExpanded] = useState(false);

  const getTypeIcon = () => {
    switch (item.type) {
      case 'service':
        return '✂️';
      case 'product':
        return '🛍️';
      case 'tip':
        return '💰';
      default:
        return '📊';
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'service':
        return 'bg-blue-100';
      case 'product':
        return 'bg-green-100';
      case 'tip':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <Card className="p-4 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View
              className={`w-10 h-10 ${getTypeColor()} rounded-full items-center justify-center`}
            >
              <Text>{getTypeIcon()}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {item.description}
              </Text>
              <Text className="text-sm text-gray-500">
                {item.customerName} • {formatDate(item.date)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="font-bold text-green-600">{formatCurrency(item.net)}</Text>
            <Text className="text-xs text-gray-500 capitalize">{item.type}</Text>
          </View>
        </View>

        {expanded && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Gross Amount</Text>
              <Text className="text-gray-900">{formatCurrency(item.amount)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Platform Fee</Text>
              <Text className="text-red-600">-{formatCurrency(item.fee)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-semibold">Net Earnings</Text>
              <Text className="text-green-600 font-semibold">{formatCurrency(item.net)}</Text>
            </View>
            <Text className="text-xs text-gray-400 mt-2">{formatTime(item.date)}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export default function EarningsHistoryScreen() {
  const { currentUser } = useAuth();
  const barberId = (currentUser as any)?.barberProfileId || currentUser?.id || '';

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useEarningsHistory(barberId, page);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (data && data.totalPages && page < data.totalPages && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [data, page, isFetching]);

  const renderItem = useCallback(({ item }: { item: IEarningItem }) => {
    return <EarningItemCard item={item} />;
  }, []);

  const renderFooter = () => {
    if (!isFetching) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-2">No earnings yet</Text>
        <Text className="text-gray-500 text-center px-8">
          Your earnings from completed services will appear here
        </Text>
      </View>
    );
  };

  if (isLoading && !data) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading history...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Summary Header */}
      {data && data.total !== undefined && data.total > 0 && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-gray-600 text-sm">
            Showing {data.earnings?.length || 0} of {data.total} transactions
          </Text>
        </View>
      )}

      <FlatList
        data={data?.earnings || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}
