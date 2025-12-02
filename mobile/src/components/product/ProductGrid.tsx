import { useCallback, useMemo } from 'react';
import { View, FlatList, type FlatListProps, type ListRenderItemInfo } from 'react-native';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { IProduct } from '@/features/products';

// Estimated item height for getItemLayout optimization (for 2 columns)
const ITEM_HEIGHT = 320;
const ITEM_PADDING = 8;

interface IProductGridProps extends Omit<FlatListProps<IProduct>, 'renderItem' | 'data'> {
  products: IProduct[];
  isLoading?: boolean;
  onProductPress?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
  showBarberName?: boolean;
  numColumns?: number;
}

/**
 * ProductGrid - Optimized FlatList for displaying products in a grid
 *
 * Performance optimizations:
 * - getItemLayout for faster scroll performance
 * - Memoized renderItem callback
 * - removeClippedSubviews for memory efficiency
 * - initialNumToRender for faster initial load
 * - maxToRenderPerBatch and windowSize for smooth scrolling
 */
export function ProductGrid({
  products,
  isLoading = false,
  onProductPress,
  onAddToCart,
  showBarberName = true,
  numColumns = 2,
  ...props
}: IProductGridProps) {
  // Memoized key extractor
  const keyExtractor = useCallback((item: IProduct) => item.id, []);

  // Memoized render item function
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IProduct>) => (
      <View className="flex-1 p-2">
        <ProductCard
          product={item}
          showBarberName={showBarberName}
          onPress={() => onProductPress?.(item)}
          onAddToCart={() => onAddToCart?.(item)}
        />
      </View>
    ),
    [showBarberName, onProductPress, onAddToCart]
  );

  // Memoized getItemLayout for grid items
  const getItemLayout = useCallback(
    (_: ArrayLike<IProduct> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT + ITEM_PADDING * 2,
      offset: (ITEM_HEIGHT + ITEM_PADDING * 2) * Math.floor(index / numColumns),
      index,
    }),
    [numColumns]
  );

  // Memoized column wrapper style
  const columnWrapperStyle = useMemo(
    () => (numColumns > 1 ? { paddingHorizontal: 8 } : undefined),
    [numColumns]
  );

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
        description="Try adjusting your filters or check back later"
      />
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      numColumns={numColumns}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerClassName="py-2"
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      {...props}
    />
  );
}
