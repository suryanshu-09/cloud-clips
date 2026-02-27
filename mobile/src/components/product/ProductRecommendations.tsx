import { useCallback } from 'react';
import { View, FlatList, Text, Pressable, ScrollView, type FlatListProps } from 'react-native';
import { router } from 'expo-router';
import { ProductCard } from './ProductCard';
import { useCart } from '@/features/products';
import type { IProduct } from '@/features/products';
import { Skeleton } from '@/components/ui/Skeleton';

interface IProductRecommendationsProps extends Omit<
  FlatListProps<IProduct>,
  'renderItem' | 'data'
> {
  products: IProduct[];
  title?: string;
  isLoading?: boolean;
  onProductPress?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

export function ProductRecommendations({
  products,
  title = 'Recommended for You',
  isLoading = false,
  onProductPress,
  onAddToCart,
  showViewAll = false,
  onViewAllPress,
  ...props
}: IProductRecommendationsProps) {
  const { addProduct } = useCart();

  const defaultOnProductPress = useCallback((product: IProduct) => {
    router.push(`/(client)/store/${product.id}`);
  }, []);

  const defaultOnAddToCart = useCallback(
    (product: IProduct) => {
      addProduct(product, 1);
    },
    [addProduct]
  );

  const renderItem = useCallback(
    ({ item }: { item: IProduct }) => (
      <View className="w-44 mr-3">
        <ProductCard
          product={item}
          showBarberName={true}
          onPress={() => onProductPress?.(item) ?? defaultOnProductPress(item)}
          onAddToCart={() => onAddToCart?.(item) ?? defaultOnAddToCart(item)}
        />
      </View>
    ),
    [onProductPress, onAddToCart, defaultOnProductPress, defaultOnAddToCart]
  );

  const keyExtractor = useCallback((item: IProduct) => item.id, []);

  if (isLoading) {
    return (
      <View className="mb-6">
        <View className="px-4 mb-3 flex-row items-center justify-between">
          <Skeleton height={24} width={180} />
          <Skeleton height={20} width={60} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="w-44 mr-3">
              <Skeleton height={280} className="rounded-lg" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
        {showViewAll && (
          <Pressable onPress={onViewAllPress}>
            <Text className="text-blue-500 font-semibold text-sm">View All</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal Product List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
        {...props}
      />
    </View>
  );
}
