import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import { BarberCard } from './BarberCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { IBarberProfile } from '@/features/barbers';

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
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-4 mb-3">
          <BarberCard
            barber={item}
            showDistance={showDistance}
            onPress={() => onBarberPress?.(item)}
          />
        </View>
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        ListFooterComponent ||
        (isLoading ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#0066CC" />
          </View>
        ) : null)
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
