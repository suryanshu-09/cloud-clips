import { useState } from 'react';
import { ScrollView, Text, View, FlatList, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, Badge } from '@/components/ui';

interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  isActive: boolean;
}

// Mock data - replace with real data from API
const MOCK_PRODUCTS: IProduct[] = [
  {
    id: '1',
    name: 'Premium Hair Gel',
    description: 'Strong hold, matte finish',
    price: 24.99,
    stock: 15,
    category: 'Styling',
    image: null,
    isActive: true,
  },
  {
    id: '2',
    name: 'Beard Oil',
    description: 'Natural oils for beard care',
    price: 19.99,
    stock: 8,
    category: 'Beard Care',
    image: null,
    isActive: true,
  },
  {
    id: '3',
    name: 'Hair Pomade',
    description: 'Medium hold, natural shine',
    price: 22.99,
    stock: 0,
    category: 'Styling',
    image: null,
    isActive: false,
  },
];

export default function BarberProductsListScreen() {
  const router = useRouter();
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${productName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // TODO: Implement API call
          setProducts(products.filter((p) => p.id !== productId));
          Alert.alert('Success', 'Product deleted successfully');
        },
      },
    ]);
  };

  const handleToggleActive = (productId: string) => {
    // TODO: Implement API call
    setProducts(products.map((p) => (p.id === productId ? { ...p, isActive: !p.isActive } : p)));
  };

  const renderProduct = ({ item }: { item: IProduct }) => (
    <Card className="mb-3 p-4">
      <View className="flex-row gap-3">
        {/* Product Image */}
        <View className="w-20 h-20 bg-gray-200 rounded-lg items-center justify-center">
          {item.image ? (
            <Image source={{ uri: item.image }} className="w-full h-full rounded-lg" />
          ) : (
            <Text className="text-2xl">📦</Text>
          )}
        </View>

        {/* Product Info */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            <Badge variant={item.isActive ? 'success' : 'default'} size="sm">
              {item.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </View>

          <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
            {item.description}
          </Text>

          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-base font-bold text-gray-900">${item.price}</Text>
            <Text className="text-gray-400">•</Text>
            <Text
              className={`text-sm ${item.stock > 0 ? 'text-gray-600' : 'text-red-600 font-medium'}`}
            >
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push(`/(barber)/products/${item.id}/edit`)}
              className="flex-1 py-2 bg-blue-50 rounded-lg active:bg-blue-100"
            >
              <Text className="text-sm font-medium text-blue-600 text-center">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleActive(item.id)}
              className="flex-1 py-2 bg-gray-100 rounded-lg active:bg-gray-200"
            >
              <Text className="text-sm font-medium text-gray-700 text-center">
                {item.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item.id, item.name)}
              className="px-4 py-2 bg-red-50 rounded-lg active:bg-red-100"
            >
              <Text className="text-sm font-medium text-red-600">🗑️</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">My Products</Text>
            <Text className="text-gray-600">Manage products you sell</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{products.length}</Text>
            <Text className="text-sm text-gray-600">Total Products</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.isActive).length}
            </Text>
            <Text className="text-sm text-gray-600">Active</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-red-600">
              {products.filter((p) => p.stock === 0).length}
            </Text>
            <Text className="text-sm text-gray-600">Out of Stock</Text>
          </View>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <Card className="p-8 items-center">
            <Text className="text-6xl mb-4">📦</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              Start selling by adding your first product
            </Text>
            <Button onPress={() => router.push('/(barber)/products/add')}>Add Product</Button>
          </Card>
        }
      />

      {/* Add Product Button */}
      {products.length > 0 && (
        <View className="p-6 bg-white border-t border-gray-200">
          <Button onPress={() => router.push('/(barber)/products/add')} size="lg">
            Add New Product
          </Button>
        </View>
      )}
    </View>
  );
}
