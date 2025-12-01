import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useOrders, useOrderMutations, OrderStatus } from '@/features/products';
import { SafeView } from '@/components/ui/SafeView';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.PAID:
      return 'info';
    case OrderStatus.SHIPPED:
      return 'primary';
    case OrderStatus.DELIVERED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    default:
      return 'secondary';
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function OrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const { data: orders, isLoading, refetch, isRefetching } = useOrders();
  const { cancelOrder, isCanceling } = useOrderMutations({
    onSuccess: () => {
      Alert.alert('Success', 'Order cancelled successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to cancel order');
    },
  });

  const filteredOrders =
    selectedStatus === 'all' ? orders : orders?.filter((order) => order.status === selectedStatus);

  const handleCancelOrder = (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => cancelOrder.mutate(orderId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeView>
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Order History</Text>
        </View>
        <ScrollView className="flex-1 p-4">
          <Skeleton height={150} className="mb-4 rounded-lg" />
          <Skeleton height={150} className="mb-4 rounded-lg" />
          <Skeleton height={150} className="rounded-lg" />
        </ScrollView>
      </SafeView>
    );
  }

  return (
    <SafeView>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Order History</Text>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Pressable onPress={() => setSelectedStatus('all')}>
              <Badge variant={selectedStatus === 'all' ? 'primary' : 'secondary'} size="md">
                All
              </Badge>
            </Pressable>
            {Object.values(OrderStatus).map((status) => (
              <Pressable key={status} onPress={() => setSelectedStatus(status)}>
                <Badge
                  variant={selectedStatus === status ? getStatusColor(status) : 'secondary'}
                  size="md"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {!filteredOrders || filteredOrders.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6 min-h-[400px]">
            <EmptyState
              icon="📦"
              title="No orders found"
              message={
                selectedStatus === 'all'
                  ? "You haven't placed any orders yet"
                  : `No ${selectedStatus} orders`
              }
            />
            {selectedStatus === 'all' && (
              <Button
                onPress={() => router.push('/(client)/store')}
                variant="primary"
                className="mt-4"
              >
                Browse Products
              </Button>
            )}
          </View>
        ) : (
          <View className="p-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} variant="elevated" padding="md" className="mb-4">
                {/* Order Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">
                      Order #{order.id.slice(0, 8)}
                    </Text>
                    <Text className="text-sm text-gray-600">{formatDate(order.createdAt)}</Text>
                  </View>
                  <Badge variant={getStatusColor(order.status)} size="sm">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </View>

                {/* Order Items */}
                <View className="mb-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </Text>
                  {order.items.slice(0, 2).map((item, index) => (
                    <Text key={index} className="text-sm text-gray-600 mb-1">
                      • {item.productName || `Product ${item.productId.slice(0, 8)}`} (x
                      {item.quantity})
                    </Text>
                  ))}
                  {order.items.length > 2 && (
                    <Text className="text-sm text-gray-500">
                      +{order.items.length - 2} more items
                    </Text>
                  )}
                </View>

                {/* Shipping Address */}
                <View className="mb-3 pb-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 mb-1">Shipping to:</Text>
                  <Text className="text-sm text-gray-700">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                  </Text>
                  <Text className="text-sm text-gray-700">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zip}
                  </Text>
                </View>

                {/* Order Total and Actions */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </Text>

                  <View className="flex-row gap-2">
                    {/* View Details Button */}
                    <Pressable
                      onPress={() => router.push(`/(client)/profile/orders/${order.id}`)}
                      className="bg-gray-100 active:bg-gray-200 rounded-lg px-4 py-2"
                    >
                      <Text className="text-gray-900 font-semibold text-sm">Details</Text>
                    </Pressable>

                    {/* Cancel Button - Only for pending/paid orders */}
                    {(order.status === OrderStatus.PENDING ||
                      order.status === OrderStatus.PAID) && (
                      <Pressable
                        onPress={() => handleCancelOrder(order.id)}
                        disabled={isCanceling}
                        className="bg-red-100 active:bg-red-200 rounded-lg px-4 py-2"
                      >
                        <Text className="text-red-700 font-semibold text-sm">
                          {isCanceling ? 'Canceling...' : 'Cancel'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeView>
  );
}
