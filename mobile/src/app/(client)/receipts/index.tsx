import React, { useState, useCallback } from 'react';
import { FlatList, Text, View, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery as useConvexQuery } from 'convex/react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Card, Avatar, EmptyState, SafeView, Header } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IReceipt {
  _id: Id<'receipts'>;
  receiptNumber: string;
  items: {
    name: string;
    quantity: number;
    total: number;
  }[];
  total: number;
  status: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  paidAt?: number;
  createdAt: number;
  barber: {
    name?: string;
    businessName?: string;
    avatar?: string;
  };
}

type ReceiptStatus = 'pending' | 'paid' | 'refunded' | 'partially_refunded';

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
const formatCurrency = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM d, yyyy');
};

const getStatusConfig = (status: ReceiptStatus) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: '#10B981',
        bgColor: '#D1FAE5',
      };
    case 'refunded':
      return {
        label: 'Refunded',
        color: '#6B7280',
        bgColor: '#F3F4F6',
      };
    case 'partially_refunded':
      return {
        label: 'Partial Refund',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
      };
    default:
      return {
        label: 'Pending',
        color: '#6B7280',
        bgColor: '#F3F4F6',
      };
  }
};

// ---------------------------------------------------------------------------
// Filter Component
// ---------------------------------------------------------------------------
interface IFilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, isActive, onPress }: IFilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${isActive ? 'bg-indigo-600' : 'bg-gray-100'}`}
    >
      <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Receipt Card Component
// ---------------------------------------------------------------------------
interface IReceiptCardProps {
  receipt: IReceipt;
  onPress: () => void;
}

function ReceiptCard({ receipt, onPress }: IReceiptCardProps) {
  const statusConfig = getStatusConfig(receipt.status);
  const mainItem = receipt.items[0];
  const hasMoreItems = receipt.items.length > 1;

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{receipt.receiptNumber}</Text>
            <Text className="text-gray-700 text-sm">
              {receipt.paidAt ? formatDate(receipt.paidAt) : formatDate(receipt.createdAt)}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusConfig.bgColor }}
          >
            <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Barber Info */}
        <View className="flex-row items-center mb-3">
          <Avatar
            source={receipt.barber.avatar}
            size="sm"
            fallback={receipt.barber.businessName?.charAt(0) || 'B'}
          />
          <Text className="text-gray-900 font-medium ml-2 flex-1" numberOfLines={1}>
            {receipt.barber.businessName || receipt.barber.name}
          </Text>
        </View>

        {/* Service Info */}
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">{mainItem?.name}</Text>
            {hasMoreItems && (
              <Text className="text-gray-500 text-sm mt-0.5">
                +{receipt.items.length - 1} more item{receipt.items.length - 1 > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <Text className="text-lg font-bold text-gray-900">{formatCurrency(receipt.total)}</Text>
        </View>

        {/* View Details */}
        <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-gray-100">
          <Text className="text-indigo-600 text-sm font-medium mr-1">View Receipt</Text>
          <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
        </View>
      </Card>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen Component
// ---------------------------------------------------------------------------
export default function ReceiptsListScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ReceiptStatus | 'all'>('all');

  // Fetch receipts
  const receipts = useConvexQuery(
    api.receipts.queries.getMyReceipts,
    selectedFilter === 'all' ? {} : { status: selectedFilter }
  ) as IReceipt[] | undefined;

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex automatically re-fetches
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Navigate to receipt details
  const handleReceiptPress = useCallback(
    (receiptId: Id<'receipts'>) => {
      router.push(`/(client)/receipts/${receiptId}`);
    },
    [router]
  );

  // Loading state
  if (receipts === undefined) {
    return (
      <SafeView>
        <Header title="Receipts" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-600 mt-4">Loading receipts...</Text>
        </View>
      </SafeView>
    );
  }

  // Empty state
  if (receipts.length === 0) {
    return (
      <SafeView>
        <Header title="Receipts" showBackButton />
        <EmptyState
          icon="receipt-outline"
          title="No receipts yet"
          message="Your payment receipts will appear here after you complete a booking or purchase."
          actionLabel="Browse Services"
          onAction={() => router.push('/(client)/discover')}
        />
      </SafeView>
    );
  }

  return (
    <SafeView>
      <Header title="Receipts" showBackButton />

      {/* Filters */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All' },
            { key: 'paid', label: 'Paid' },
            { key: 'refunded', label: 'Refunded' },
            { key: 'partially_refunded', label: 'Partial' },
          ]}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              isActive={selectedFilter === item.key}
              onPress={() => setSelectedFilter(item.key as ReceiptStatus | 'all')}
            />
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Receipts List */}
      <FlatList
        className="flex-1 px-4 pt-4"
        data={receipts}
        renderItem={({ item }) => (
          <ReceiptCard receipt={item} onPress={() => handleReceiptPress(item._id)} />
        )}
        keyExtractor={(item) => item._id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No receipts found for this filter
            </Text>
            <Pressable onPress={() => setSelectedFilter('all')} className="mt-4">
              <Text className="text-indigo-600 font-medium">Clear Filters</Text>
            </Pressable>
          </View>
        }
      />
    </SafeView>
  );
}
