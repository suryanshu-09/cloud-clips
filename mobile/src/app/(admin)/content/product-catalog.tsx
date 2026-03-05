import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
  Modal,
  Switch,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';

type Tab = 'products' | 'categories';

interface ICategoryFormData {
  name: string;
  slug: string;
  description: string;
}

interface IProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
}

export default function ProductCatalogScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <Text className="text-purple-600 text-lg">←</Text>
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Product Catalog</Text>
        </View>
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          <Pressable
            onPress={() => setActiveTab('products')}
            className={`flex-1 py-2 px-3 rounded-md ${
              activeTab === 'products' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                activeTab === 'products' ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              Products
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('categories')}
            className={`flex-1 py-2 px-3 rounded-md ${
              activeTab === 'categories' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                activeTab === 'categories' ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              Categories
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'products' ? (
        <ProductsTab refreshing={refreshing} onRefresh={onRefresh} />
      ) : (
        <CategoriesTab refreshing={refreshing} onRefresh={onRefresh} />
      )}
    </View>
  );
}

function ProductsTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [formData, setFormData] = useState<IProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });

  const products = useQuery(api.admin.productCatalog.adminGetAllProducts, {
    isActive: filter === 'all' ? undefined : filter === 'active',
    search: search || undefined,
  });

  const setProductActive = useMutation(api.admin.productCatalog.adminSetProductActive);
  const updateProduct = useMutation(api.admin.productCatalog.adminUpdateProduct);
  const deleteProduct = useMutation(api.admin.productCatalog.adminDeleteProduct);

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      await setProductActive({ productId: productId as any, isActive: !currentActive });
    } catch (error) {
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const handleDelete = (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct({ productId: productId as any });
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      category: product.category || '',
    });
    setEditModal(product);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      await updateProduct({
        productId: editModal._id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || undefined,
        stock: parseInt(formData.stock) || undefined,
        category: formData.category,
      });
      setEditModal(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  if (products === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  const filteredProducts =
    filter !== 'all' ? products.filter((p: any) => p.isActive === (filter === 'active')) : products;

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4 gap-4">
        <View className="flex-row gap-2">
          <TextInput
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </View>
        <View className="flex-row gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full ${
                filter === f ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${filter === f ? 'text-white' : 'text-gray-700'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm text-gray-500">{filteredProducts.length} products</Text>

        {filteredProducts.map((product: any) => (
          <Card key={product._id} className="p-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{product.name}</Text>
                <Text className="text-sm text-gray-500">{product.category}</Text>
                <Text className="text-purple-600 font-bold mt-1">${product.price?.toFixed(2)}</Text>
                <Text className="text-xs text-gray-400 mt-1">
                  Stock: {product.stock} • {product.barber?.businessName || 'Unknown barber'}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Switch
                  value={product.isActive}
                  onValueChange={() => handleToggleActive(product._id, product.isActive)}
                  trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                  thumbColor={product.isActive ? '#7c3aed' : '#9ca3af'}
                />
              </View>
            </View>
            <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
              <Pressable
                onPress={() => handleEdit(product)}
                className="flex-1 bg-gray-100 py-2 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-gray-700">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(product._id)}
                className="flex-1 bg-red-50 py-2 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-red-600">Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <Modal visible={!!editModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6 max-h-[80%]">
            <Text className="text-lg font-bold mb-4">Edit Product</Text>
            <ScrollView>
              <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
              />
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(v) => setFormData({ ...formData, description: v })}
                multiline
                numberOfLines={3}
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
              />
              <Text className="text-sm font-medium text-gray-700 mb-1">Price</Text>
              <TextInput
                value={formData.price}
                onChangeText={(v) => setFormData({ ...formData, price: v })}
                keyboardType="decimal-pad"
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
              />
              <Text className="text-sm font-medium text-gray-700 mb-1">Stock</Text>
              <TextInput
                value={formData.stock}
                onChangeText={(v) => setFormData({ ...formData, stock: v })}
                keyboardType="number-pad"
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
              />
              <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
              <TextInput
                value={formData.category}
                onChangeText={(v) => setFormData({ ...formData, category: v })}
                className="border border-gray-200 rounded-lg px-3 py-2 mb-4"
              />
            </ScrollView>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditModal(null)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveEdit} className="flex-1 bg-purple-600 py-3 rounded-lg">
                <Text className="text-center font-medium text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function CategoriesTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [formData, setFormData] = useState<ICategoryFormData>({
    name: '',
    slug: '',
    description: '',
  });

  const categories = useQuery(api.admin.productCatalog.adminGetCategories, {});

  const createCategory = useMutation(api.admin.productCatalog.adminCreateCategory);
  const updateCategory = useMutation(api.admin.productCatalog.adminUpdateCategory);
  const deleteCategory = useMutation(api.admin.productCatalog.adminDeleteCategory);

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      Alert.alert('Error', 'Name and slug are required');
      return;
    }
    try {
      await createCategory({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      });
      setCreateModal(false);
      setFormData({ name: '', slug: '', description: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create category');
    }
  };

  const handleEdit = (category: any) => {
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
    setEditModal(category);
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    try {
      await updateCategory({
        categoryId: editModal._id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      });
      setEditModal(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update category');
    }
  };

  const handleDelete = (categoryId: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory({ categoryId: categoryId as any });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete category');
          }
        },
      },
    ]);
  };

  if (categories === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4 gap-4">
        <Pressable onPress={() => setCreateModal(true)} className="bg-purple-600 py-3 rounded-lg">
          <Text className="text-white text-center font-semibold">+ Add Category</Text>
        </Pressable>

        <Text className="text-sm text-gray-500">{categories.length} categories</Text>

        {categories.map((category: any) => (
          <Card key={category._id} className="p-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{category.name}</Text>
                <Text className="text-sm text-gray-500">{category.slug}</Text>
                {category.description && (
                  <Text className="text-xs text-gray-400 mt-1">{category.description}</Text>
                )}
                <View className="flex-row items-center gap-2 mt-2">
                  <View
                    className={`w-2 h-2 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <Text className="text-xs text-gray-500">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
              <Pressable
                onPress={() => handleEdit(category)}
                className="flex-1 bg-gray-100 py-2 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-gray-700">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(category._id)}
                className="flex-1 bg-red-50 py-2 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-red-600">Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <Modal visible={createModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold mb-4">Create Category</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1">Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
              placeholder="Category name"
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Slug *</Text>
            <TextInput
              value={formData.slug}
              onChangeText={(v) => setFormData({ ...formData, slug: v })}
              placeholder="category-slug"
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={formData.description}
              onChangeText={(v) => setFormData({ ...formData, description: v })}
              multiline
              numberOfLines={3}
              placeholder="Optional description"
              className="border border-gray-200 rounded-lg px-3 py-2 mb-4"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setCreateModal(false);
                  setFormData({ name: '', slug: '', description: '' });
                }}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreate} className="flex-1 bg-purple-600 py-3 rounded-lg">
                <Text className="text-center font-medium text-white">Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold mb-4">Edit Category</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1">Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Slug *</Text>
            <TextInput
              value={formData.slug}
              onChangeText={(v) => setFormData({ ...formData, slug: v })}
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={formData.description}
              onChangeText={(v) => setFormData({ ...formData, description: v })}
              multiline
              numberOfLines={3}
              className="border border-gray-200 rounded-lg px-3 py-2 mb-4"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditModal(null)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleUpdate} className="flex-1 bg-purple-600 py-3 rounded-lg">
                <Text className="text-center font-medium text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
