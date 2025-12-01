import { useState } from 'react';
import { View, ScrollView, Pressable, Text, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteProducts, useCart, ProductCategory } from '@/features/products';
import { ProductGrid } from '@/components/product';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { SafeView } from '@/components/ui/SafeView';

const categories = [
  { value: '', label: 'All' },
  { value: ProductCategory.HAIR_CARE, label: 'Hair Care' },
  { value: ProductCategory.STYLING, label: 'Styling' },
  { value: ProductCategory.BEARD_CARE, label: 'Beard Care' },
  { value: ProductCategory.SKIN_CARE, label: 'Skin Care' },
  { value: ProductCategory.TOOLS, label: 'Tools' },
  { value: ProductCategory.ACCESSORIES, label: 'Accessories' },
];

export default function ProductCatalogScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addProduct, itemCount } = useCart();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteProducts({
      category: selectedCategory || undefined,
      search: search || undefined,
      limit: 20,
    });

  // Flatten pages into single array
  const products = data?.pages.flatMap((page) => page.products) ?? [];

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200"
        contentContainerClassName="px-4 py-3 gap-2"
      >
        {categories.map((category) => (
          <Pressable key={category.value} onPress={() => setSelectedCategory(category.value)}>
            <Badge
              variant={selectedCategory === category.value ? 'primary' : 'secondary'}
              size="md"
            >
              {category.label}
            </Badge>
          </Pressable>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <View className="flex-1">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onProductPress={(product) => handleProductPress(product.id)}
          onAddToCart={handleAddToCart}
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500">Loading more...</Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeView>
  );
}
