import { useState, useCallback, useMemo } from 'react';
import { View, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import {
  useInfiniteProducts,
  useCart,
  useFeaturedProducts,
  ProductCategory,
} from '@/features/products';
import { ProductGrid, CategoryFilter, ProductRecommendations } from '@/components/product';
import { Input } from '@/components/ui/Input';
import { SafeView } from '@/components/ui/SafeView';
import { triggerSelectionHaptic } from '@/services/haptics';
import type { IProduct } from '@/features/products';

const categories = [
  { value: '', label: 'All', icon: '🏪' },
  { value: ProductCategory.HAIR_CARE, label: 'Hair Care', icon: '💇' },
  { value: ProductCategory.STYLING, label: 'Styling', icon: '✨' },
  { value: ProductCategory.BEARD_CARE, label: 'Beard Care', icon: '🧔' },
  { value: ProductCategory.SKIN_CARE, label: 'Skin Care', icon: '🧴' },
  { value: ProductCategory.TOOLS, label: 'Tools', icon: '✂️' },
  { value: ProductCategory.ACCESSORIES, label: 'Accessories', icon: '🎒' },
];

export default function ProductCatalogScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addProduct, itemCount } = useCart();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteProducts({
    category: selectedCategory || undefined,
    search: search || undefined,
    limit: 20,
  });

  // Featured products for recommendations
  const { data: featuredData, isLoading: isFeaturedLoading } = useFeaturedProducts();

  // Flatten pages into single array — memoized to avoid unnecessary re-allocations
  const products = useMemo(() => data?.pages.flatMap((page) => page.products) ?? [], [data?.pages]);
  const featuredProducts = useMemo(() => featuredData?.products ?? [], [featuredData?.products]);

  const handleProductPress = useCallback((product: IProduct) => {
    router.push(`/(client)/store/${product.id}`);
  }, []);

  const handleAddToCart = useCallback(
    (product: IProduct) => {
      addProduct(product, 1);
    },
    [addProduct]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCartPress = useCallback(() => {
    triggerSelectionHaptic();
    router.push('/(client)/store/cart');
  }, []);

  const handleViewAll = useCallback(() => {
    setSelectedCategory('');
  }, []);

  // Section title for the current category filter
  const sectionTitle = useMemo(
    () =>
      selectedCategory
        ? (categories.find((c) => c.value === selectedCategory)?.label ?? 'Products')
        : 'All Products',
    [selectedCategory]
  );

  /**
   * ListHeaderComponent for the ProductGrid FlatList.
   * Using this instead of a wrapping ScrollView avoids the
   * nested scrollable anti-pattern, which blocks FlatList's
   * own scroll-event optimizations.
   */
  const ListHeader = useMemo(
    () => (
      <View>
        {/* Product Recommendations */}
        <ProductRecommendations
          products={featuredProducts}
          title="Recommended for You"
          isLoading={isFeaturedLoading}
          showViewAll={true}
          onViewAllPress={handleViewAll}
        />

        {/* Section Title */}
        <View className="px-4 mb-3">
          <Text className="text-lg font-bold text-gray-900">{sectionTitle}</Text>
        </View>
      </View>
    ),
    [featuredProducts, isFeaturedLoading, handleViewAll, sectionTitle]
  );

  const ListFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <View className="py-4 items-center">
          <Text className="text-gray-500">Loading more...</Text>
        </View>
      ) : null,
    [isFetchingNextPage]
  );

  return (
    <SafeView>
      {/* Fixed Header — search & cart */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Store</Text>

          {/* Cart Button */}
          <Pressable onPress={handleCartPress} className="relative">
            <View className="bg-blue-500 rounded-full p-2 px-4">
              <Text className="text-white font-semibold">Cart</Text>
            </View>
            {itemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{itemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          leftIcon="🔍"
        />
      </View>

      {/* Fixed Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        className="bg-white border-b border-gray-200"
      />

      {/*
       * ProductGrid is a FlatList — it owns the scroll.
       * We pass recommendations + title as ListHeaderComponent
       * to avoid wrapping a FlatList inside a ScrollView.
       */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        onProductPress={handleProductPress}
        onAddToCart={handleAddToCart}
        numColumns={2}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
      />
    </SafeView>
  );
}
