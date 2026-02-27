import { View, Text, FlatList } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { IService } from '@/features/barbers';

interface IServiceListProps {
  services: IService[];
  onServiceSelect?: (service: IService) => void;
  selectedServiceId?: string;
  variant?: 'default' | 'compact';
}

export function ServiceList({
  services,
  onServiceSelect,
  selectedServiceId,
  variant = 'default',
}: IServiceListProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderService = ({ item }: { item: IService }) => {
    const isSelected = selectedServiceId === item.id;

    return (
      <Card
        variant={isSelected ? 'elevated' : 'outlined'}
        padding={variant === 'compact' ? 'sm' : 'md'}
        className={`mb-3 ${isSelected ? 'border-2 border-blue-500' : ''}`}
      >
        <View
          className={`${onServiceSelect ? 'cursor-pointer' : ''}`}
          onTouchEnd={() => onServiceSelect?.(item)}
        >
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
              {item.description && variant === 'default' && (
                <Text className="text-sm text-gray-600" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-500">⏱️</Text>
              <Text className="text-xs text-gray-500">{formatDuration(item.duration)}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (services.length === 0) {
    return (
      <View className="p-4 items-center">
        <Text className="text-gray-500 text-center">No services available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={renderService}
      scrollEnabled={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}
