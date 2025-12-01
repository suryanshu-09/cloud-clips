import { View, Text, Pressable, Image, type PressableProps } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { IProduct } from '@/features/products';

interface IProductCardProps extends Omit<PressableProps, 'children'> {
  product: IProduct;
  showBarberName?: boolean;
  onAddToCart?: () => void;
}

export function ProductCard({
  product,
  showBarberName = true,
  onAddToCart,
  ...props
}: IProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Pressable {...props} disabled={isOutOfStock}>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Product Image */}
        <View className="relative w-full aspect-square bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-4xl">📦</Text>
            </View>
          )}

          {/* Stock Badge */}
          {isOutOfStock && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <Badge variant="error" size="lg">
                Out of Stock
              </Badge>
            </View>
          )}

          {isLowStock && (
            <View className="absolute top-2 right-2">
              <Badge variant="warning" size="sm">
                Only {product.stock} left
              </Badge>
            </View>
          )}

          {/* Rating Badge */}
          {product.rating > 0 && (
            <View className="absolute top-2 left-2">
              <View className="bg-white/90 rounded-full px-2 py-1 flex-row items-center gap-1">
                <Text className="text-yellow-500 text-xs">⭐</Text>
                <Text className="text-xs font-semibold text-gray-900">
                  {product.rating.toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-3">
          {/* Category */}
          {product.category && (
            <Text className="text-xs text-gray-500 uppercase mb-1">
              {product.category.replace('_', ' ')}
            </Text>
          )}

          {/* Product Name */}
          <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {product.name}
          </Text>

          {/* Description */}
          {product.description && (
            <Text className="text-xs text-gray-600 mb-2" numberOfLines={2}>
              {product.description}
            </Text>
          )}

          {/* Barber Name */}
          {showBarberName && product.barberName && (
            <Text className="text-xs text-gray-500 mb-2">Sold by {product.barberName}</Text>
          )}

          {/* Price and Reviews */}
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</Text>

            {product.totalReviews > 0 && (
              <Text className="text-xs text-gray-500">({product.totalReviews} reviews)</Text>
            )}
          </View>

          {/* Add to Cart Button */}
          {onAddToCart && !isOutOfStock && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="mt-3 bg-blue-500 active:bg-blue-600 rounded-lg py-2 items-center"
            >
              <Text className="text-white font-semibold text-sm">Add to Cart</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
