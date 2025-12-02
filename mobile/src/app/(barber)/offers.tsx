import { useState } from 'react';
import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { Card, Button, Badge, Input, BottomSheet } from '@/components/ui';

type DiscountType = 'percentage' | 'fixed';
type CouponStatus = 'active' | 'expired' | 'scheduled';

interface ICoupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: CouponStatus;
}

// Mock data - replace with real data from API
const MOCK_COUPONS: ICoupon[] = [
  {
    id: '1',
    code: 'NEWYEAR25',
    description: 'New Year Special - 25% off all services',
    discountType: 'percentage',
    discountValue: 25,
    minPurchase: 30,
    maxDiscount: 50,
    usageLimit: 100,
    usedCount: 45,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'scheduled',
  },
  {
    id: '2',
    code: 'FIRST10',
    description: 'First time customer discount',
    discountType: 'fixed',
    discountValue: 10,
    minPurchase: 0,
    usageLimit: 50,
    usedCount: 32,
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    status: 'active',
  },
];

export default function OffersScreen() {
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: '',
    minPurchase: '',
    usageLimit: '',
  });

  const handleDelete = (couponId: string, code: string) => {
    Alert.alert('Delete Coupon', `Are you sure you want to delete "${code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // TODO: Implement API call
          setCoupons(coupons.filter((c) => c.id !== couponId));
          Alert.alert('Success', 'Coupon deleted successfully');
        },
      },
    ]);
  };

  const handleCreateCoupon = async () => {
    // Validation
    if (!formData.code.trim()) {
      Alert.alert('Error', 'Coupon code is required');
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Coupon created successfully!');
      setShowCreateSheet(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '',
        usageLimit: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create coupon');
    }
  };

  const getStatusBadgeVariant = (status: CouponStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'danger';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderCoupon = ({ item }: { item: ICoupon }) => (
    <Card className="mb-3 p-4">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="bg-blue-100 px-3 py-1 rounded-lg">
              <Text className="text-base font-bold text-blue-700">{item.code}</Text>
            </View>
            <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </View>
          <Text className="text-sm text-gray-600 mt-2">{item.description}</Text>
        </View>
      </View>

      <View className="space-y-2 mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Discount</Text>
          <Text className="text-base font-semibold text-gray-900">
            {item.discountType === 'percentage'
              ? `${item.discountValue}%`
              : `$${item.discountValue}`}
            {item.maxDiscount && ` (max $${item.maxDiscount})`}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Min. Purchase</Text>
          <Text className="text-base font-semibold text-gray-900">
            {item.minPurchase > 0 ? `$${item.minPurchase}` : 'None'}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Usage</Text>
          <Text className="text-base font-semibold text-gray-900">
            {item.usedCount} / {item.usageLimit}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Valid Period</Text>
          <Text className="text-sm text-gray-900">
            {item.startDate} - {item.endDate}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500"
            style={{ width: `${(item.usedCount / item.usageLimit) * 100}%` }}
          />
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          Edit
        </Button>
        <Pressable
          onPress={() => handleDelete(item.id, item.code)}
          className="px-4 py-2 bg-red-50 rounded-lg active:bg-red-100"
        >
          <Text className="text-sm font-medium text-red-600">Delete</Text>
        </Pressable>
      </View>
    </Card>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Offers & Coupons</Text>
        <Text className="text-gray-600">Create and manage special offers</Text>
      </View>

      {/* Stats */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{coupons.length}</Text>
            <Text className="text-sm text-gray-600">Total Coupons</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-green-600">
              {coupons.filter((c) => c.status === 'active').length}
            </Text>
            <Text className="text-sm text-gray-600">Active</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-blue-600">
              {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
            </Text>
            <Text className="text-sm text-gray-600">Total Uses</Text>
          </View>
        </View>
      </View>

      {/* Coupons List */}
      <FlatList
        data={coupons}
        renderItem={renderCoupon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <Card className="p-8 items-center">
            <Text className="text-6xl mb-4">🎟️</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Coupons Yet</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              Create your first coupon to attract more customers
            </Text>
            <Button onPress={() => setShowCreateSheet(true)}>Create Coupon</Button>
          </Card>
        }
      />

      {/* Create Coupon Button */}
      {coupons.length > 0 && (
        <View className="p-6 bg-white border-t border-gray-200">
          <Button onPress={() => setShowCreateSheet(true)} size="lg">
            Create New Coupon
          </Button>
        </View>
      )}

      {/* Create Coupon Bottom Sheet */}
      <BottomSheet visible={showCreateSheet} onClose={() => setShowCreateSheet(false)}>
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">Create Coupon</Text>

          <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Coupon Code *</Text>
              <Input
                placeholder="e.g., SUMMER25"
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                autoCapitalize="characters"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <Input
                placeholder="Describe your offer"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Discount Type *</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setFormData({ ...formData, discountType: 'percentage' })}
                  className={`flex-1 py-3 rounded-lg ${
                    formData.discountType === 'percentage' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      formData.discountType === 'percentage' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Percentage (%)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFormData({ ...formData, discountType: 'fixed' })}
                  className={`flex-1 py-3 rounded-lg ${
                    formData.discountType === 'fixed' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      formData.discountType === 'fixed' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Fixed Amount ($)
                  </Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Discount Value * {formData.discountType === 'percentage' ? '(%)' : '($)'}
              </Text>
              <Input
                placeholder={formData.discountType === 'percentage' ? '25' : '10.00'}
                value={formData.discountValue}
                onChangeText={(text) => setFormData({ ...formData, discountValue: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Min. Purchase ($)</Text>
              <Input
                placeholder="0.00"
                value={formData.minPurchase}
                onChangeText={(text) => setFormData({ ...formData, minPurchase: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Usage Limit *</Text>
              <Input
                placeholder="100"
                value={formData.usageLimit}
                onChangeText={(text) => setFormData({ ...formData, usageLimit: text })}
                keyboardType="number-pad"
              />
            </View>

            <View className="flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onPress={() => setShowCreateSheet(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onPress={handleCreateCoupon} className="flex-1">
                Create
              </Button>
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
