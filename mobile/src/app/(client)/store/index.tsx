import { useState } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
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

  // Flatten pages into single array
  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const featuredProducts = featuredData?.products ?? [];

  const handleProductPress = (productId: string) => {
    router.push(`/(client)/store/${productId}`);
  };

  const handleAddToCart = (product: any) => {
    addProduct(product, 1);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SafeView>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Store</Text>

          {/* Cart Button */}
          <Pressable onPress={() => router.push('/(client)/store/cart')} className="relative">
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

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        className="bg-white border-b border-gray-200"
      />

      {/* Main Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Recommendations */}
        <ProductRecommendations
          products={featuredProducts}
          title="Recommended for You"
          isLoading={isFeaturedLoading}
          showViewAll={true}
          onViewAllPress={() => setSelectedCategory('')}
        />

        {/* Section Title */}
        <View className="px-4 mb-3">
          <Text className="text-lg font-bold text-gray-900">
            {selectedCategory
              ? categories.find((c) => c.value === selectedCategory)?.label
              : 'All Products'}
          </Text>
        </View>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onProductPress={(product) => handleProductPress(product.id)}
          onAddToCart={handleAddToCart}
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500">Loading more...</Text>
              </View>
            ) : null
          }
        />
      </ScrollView>
    </SafeView>
  );
}
