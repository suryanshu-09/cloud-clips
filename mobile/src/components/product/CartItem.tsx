import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import type { ICartItem } from '@/store/atoms/cartAtom';

interface ICartItemProps {
  item: ICartItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
}

function CartItemComponent({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  readOnly = false,
}: ICartItemProps) {
  const itemTotal = item.price * item.quantity;

  return (
    <Card variant="outlined" padding="sm" className="mb-3">
      <View className="flex-row gap-3">
        {/* Product Image */}
        <View className="w-20 h-20 rounded-lg overflow-hidden">
          <OptimizedImage
            source={item.image}
            width={80}
            height={80}
            contentFit="cover"
            fallbackIcon="📦"
          />
        </View>

        {/* Product Info */}
        <View className="flex-1 justify-between">
          {/* Name and Price */}
          <View>
            <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {item.name}
            </Text>

            {item.barberName && (
              <Text className="text-xs text-gray-500 mb-1">Sold by {item.barberName}</Text>
            )}

            <Text className="text-sm font-bold text-gray-900">${item.price.toFixed(2)}</Text>
          </View>

          {/* Quantity Controls and Total */}
          <View className="flex-row items-center justify-between">
            {!readOnly ? (
              <View className="flex-row items-center bg-gray-100 rounded-lg">
                {/* Decrement Button */}
                <Pressable
                  onPress={onDecrement}
                  className="px-3 py-1 active:bg-gray-200 rounded-l-lg"
                >
                  <Text className="text-gray-700 font-bold text-lg">−</Text>
                </Pressable>

                {/* Quantity */}
                <View className="px-4 py-1 border-x border-gray-200">
                  <Text className="text-gray-900 font-semibold">{item.quantity}</Text>
                </View>

                {/* Increment Button */}
                <Pressable
                  onPress={onIncrement}
                  className="px-3 py-1 active:bg-gray-200 rounded-r-lg"
                >
                  <Text className="text-gray-700 font-bold text-lg">+</Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
            )}

            {/* Item Total */}
            <Text className="text-base font-bold text-gray-900">${itemTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Remove Button */}
        {!readOnly && onRemove && (
          <Pressable
            onPress={onRemove}
            className="w-8 h-8 items-center justify-center active:bg-gray-100 rounded-full"
          >
            <Text className="text-red-500 text-xl">×</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

export const CartItem = memo(CartItemComponent);
