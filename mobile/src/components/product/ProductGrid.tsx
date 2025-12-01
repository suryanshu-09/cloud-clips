import { View, FlatList, type FlatListProps } from 'react-native';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { IProduct } from '@/features/products';

interface IProductGridProps extends Omit<FlatListProps<IProduct>, 'renderItem' | 'data'> {
  products: IProduct[];
  isLoading?: boolean;
  onProductPress?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
  showBarberName?: boolean;
  numColumns?: number;
}

export function ProductGrid({
  products,
  isLoading = false,
  onProductPress,
  onAddToCart,
  showBarberName = true,
  numColumns = 2,
  ...props
}: IProductGridProps) {
  if (isLoading) {
    return (
      <View className="flex-1 p-4">
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Skeleton height={250} className="rounded-lg" />
          </View>
          <View className="flex-1">
            <Skeleton height={250} className="rounded-lg" />
          </View>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Skeleton height={250} className="rounded-lg" />
          </View>
          <View className="flex-1">
            <Skeleton height={250} className="rounded-lg" />
          </View>
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No products found"
        message="Try adjusting your filters or check back later"
      />
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View className="flex-1 p-2">
          <ProductCard
            product={item}
            showBarberName={showBarberName}
            onPress={() => onProductPress?.(item)}
            onAddToCart={() => onAddToCart?.(item)}
          />
        </View>
      )}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: 8 } : undefined}
      contentContainerClassName="py-2"
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}
