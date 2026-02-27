import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Card } from '@/components/ui';
import { usePayouts, useConnectAccount } from '@/features/earnings';
import type { IPayout, PayoutStatus } from '@/features/earnings';

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

// Get status display info
const getStatusInfo = (status: PayoutStatus) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✓',
      };
    case 'in_transit':
      return {
        label: 'In Transit',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '→',
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏳',
      };
    case 'failed':
      return {
        label: 'Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '✗',
      };
    case 'canceled':
      return {
        label: 'Canceled',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '−',
      };
    default:
      return {
        label: status,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '?',
      };
  }
};

// Payout item component
function PayoutItemCard({ item }: { item: IPayout }) {
  const statusInfo = getStatusInfo(item.status);

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-10 h-10 ${statusInfo.bgColor} rounded-full items-center justify-center`}
          >
            <Text className={statusInfo.color}>{statusInfo.icon}</Text>
          </View>
          <View>
            <Text className="font-semibold text-gray-900">{formatCurrency(item.amount)}</Text>
            <Text className="text-sm text-gray-500">
              {item.status === 'paid'
                ? `Arrived ${formatDate(item.arrivalDate)}`
                : item.status === 'in_transit'
                  ? `Expected ${formatDate(item.arrivalDate)}`
                  : `Created ${formatDate(item.createdAt)}`}
            </Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
          <Text className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</Text>
        </View>
      </View>

      {item.failureMessage && (
        <View className="mt-3 p-3 bg-red-50 rounded-lg">
          <Text className="text-sm text-red-700">{item.failureMessage}</Text>
        </View>
      )}
    </Card>
  );
}

export default function PayoutsScreen() {
  const { payouts, isLoading, fetchPayouts } = usePayouts(25);
  const { openDashboard, isLoading: isOpeningDashboard } = useConnectAccount();

  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayouts();
    setRefreshing(false);
  }, [fetchPayouts]);

  const handleOpenDashboard = useCallback(async () => {
    try {
      await openDashboard();
    } catch (error) {
      console.error('Failed to open dashboard:', error);
    }
  }, [openDashboard]);

  const renderItem = useCallback(({ item }: { item: IPayout }) => {
    return <PayoutItemCard item={item} />;
  }, []);

  const renderHeader = () => {
    return (
      <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 mb-1">Stripe Dashboard</Text>
            <Text className="text-sm text-gray-600">
              View detailed payout information and manage your bank account
            </Text>
          </View>
          <View className="bg-blue-500 px-4 py-2 rounded-lg" onTouchEnd={handleOpenDashboard}>
            {isOpeningDashboard ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Open</Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-4xl mb-4">🏦</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-2">No payouts yet</Text>
        <Text className="text-gray-500 text-center px-8">
          Your payout history will appear here once you start receiving payments
        </Text>
      </View>
    );
  };

  if (isLoading && !payouts) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading payouts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={payouts?.payouts || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}
