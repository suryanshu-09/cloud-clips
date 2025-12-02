import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, Input } from '@/components/ui';

const CATEGORIES = [
  'Styling Products',
  'Beard Care',
  'Hair Care',
  'Shaving',
  'Tools & Equipment',
  'Other',
];

export default function AddProductScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: CATEGORIES[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Product added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Add Product</Text>
        <Text className="text-gray-600">List a new product for sale</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Product Image */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Product Image</Text>
            <Pressable className="w-full h-48 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300 active:bg-gray-200">
              <Text className="text-4xl mb-2">📷</Text>
              <Text className="text-sm text-gray-600">Tap to upload image</Text>
            </Pressable>
          </Card>

          {/* Basic Info */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Basic Information</Text>
            <View className="space-y-3">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Product Name *</Text>
                <Input
                  placeholder="e.g., Premium Hair Gel"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                <Input
                  placeholder="Describe your product"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {CATEGORIES.map((category) => (
                      <Pressable
                        key={category}
                        onPress={() => setFormData({ ...formData, category })}
                        className={`px-4 py-2 rounded-full ${
                          formData.category === category ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            formData.category === category ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Card>

          {/* Pricing & Stock */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Pricing & Stock</Text>
            <View className="space-y-3">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Price ($) *</Text>
                <Input
                  placeholder="0.00"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Stock Quantity *</Text>
                <Input
                  placeholder="0"
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Text className="text-sm text-gray-700">
              💡 Make sure to upload clear product images and provide accurate descriptions to help
              customers make informed decisions.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleSubmit} disabled={isSubmitting} size="lg">
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </Button>
      </View>
    </View>
  );
}
