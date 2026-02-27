import { useState } from 'react';
import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, Button, Badge, Input, BottomSheet } from '@/components/ui';

type DiscountType = 'percentage' | 'fixed_amount';
type CouponStatus = 'active' | 'expired' | 'scheduled';

interface ICoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  applicableTo: 'services' | 'products' | 'both';
  maxUses?: number;
  maxUsesPerUser?: number;
  minPurchaseAmount?: number;
  currentUses: number;
  validFrom: number;
  validUntil?: number;
  isActive: boolean;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getCouponStatus = (coupon: ICoupon): CouponStatus => {
  const now = Date.now();
  if (!coupon.isActive) return 'expired';
  if (now < coupon.validFrom) return 'scheduled';
  if (coupon.validUntil && now > coupon.validUntil) return 'expired';
  return 'active';
};

export default function OffersScreen() {
  const _router = useRouter();
  const coupons = useQuery(api.coupons.queries.getCoupons) ?? [];

  const createCouponMutation = useMutation(api.coupons.mutations.createCoupon);
  const toggleCouponMutation = useMutation(api.coupons.mutations.toggleCoupon);
  const updateCouponMutation = useMutation(api.coupons.mutations.updateCoupon);
  const deleteCouponMutation = useMutation(api.coupons.mutations.deleteCoupon);

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: '',
    applicableTo: 'services' as 'services' | 'products' | 'both',
    maxUses: '',
    minPurchaseAmount: '',
    validFrom: Date.now(),
    validUntil: '',
  });

  const _handleToggle = async (couponId: string, currentStatus: boolean) => {
    try {
      await toggleCouponMutation({
        couponId: couponId as any,
        isActive: !currentStatus,
      });
      Alert.alert('Success', `Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update coupon');
    }
  };

  const handleDelete = async (couponId: string, code: string) => {
    try {
      await deleteCouponMutation({
        couponId: couponId as any,
      });
      Alert.alert('Success', `Coupon ${code} deleted successfully`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete coupon');
    }
  };

  const handleEditCoupon = async () => {
    if (!editingCoupon) return;

    if (!editingCoupon.discountValue || editingCoupon.discountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    try {
      await updateCouponMutation({
        couponId: editingCoupon._id as any,
        description: editingCoupon.description || undefined,
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        applicableTo: editingCoupon.applicableTo,
        maxUses: editingCoupon.maxUses,
        minPurchaseAmount: editingCoupon.minPurchaseAmount,
        validUntil: editingCoupon.validUntil,
      });

      Alert.alert('Success', 'Coupon updated successfully!');
      setShowCreateSheet(false);
      setEditingCoupon(null);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update coupon');
    }
  };

  const handleCreateCoupon = async () => {
    if (!formData.code.trim()) {
      Alert.alert('Error', 'Coupon code is required');
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    try {
      await createCouponMutation({
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        applicableTo: formData.applicableTo,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        minPurchaseAmount: formData.minPurchaseAmount
          ? parseFloat(formData.minPurchaseAmount)
          : undefined,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil ? new Date(formData.validUntil).getTime() : undefined,
      });

      Alert.alert('Success', 'Coupon created successfully!');
      setShowCreateSheet(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        applicableTo: 'services',
        maxUses: '',
        minPurchaseAmount: '',
        validFrom: Date.now(),
        validUntil: '',
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create coupon');
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

  const activeCount = coupons.filter((c: ICoupon) => getCouponStatus(c) === 'active').length;
  const totalUses = coupons.reduce((sum: number, c: ICoupon) => sum + c.currentUses, 0);

  const renderCoupon = ({ item }: { item: ICoupon }) => {
    const status = getCouponStatus(item);

    return (
      <Card className="mb-3 p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-blue-100 px-3 py-1 rounded-lg">
                <Text className="text-base font-bold text-blue-700">{item.code}</Text>
              </View>
              <Badge variant={getStatusBadgeVariant(status)} size="sm">
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Min. Purchase</Text>
            <Text className="text-base font-semibold text-gray-900">
              {item.minPurchaseAmount ? `$${item.minPurchaseAmount}` : 'None'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Usage</Text>
            <Text className="text-base font-semibold text-gray-900">
              {item.currentUses} / {item.maxUses || '∞'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Valid Period</Text>
            <Text className="text-sm text-gray-900">
              {formatDate(item.validFrom)} -{' '}
              {item.validUntil ? formatDate(item.validUntil) : 'No expiry'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        {item.maxUses && (
          <View className="mb-3">
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500"
                style={{ width: `${(item.currentUses / item.maxUses) * 100}%` }}
              />
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onPress={() => {
              setEditingCoupon(item);
              setFormData({
                code: item.code,
                description: item.description || '',
                discountType: item.discountType,
                discountValue: item.discountValue.toString(),
                applicableTo: item.applicableTo,
                maxUses: item.maxUses?.toString() || '',
                minPurchaseAmount: item.minPurchaseAmount?.toString() || '',
                validFrom: item.validFrom,
                validUntil: item.validUntil
                  ? new Date(item.validUntil).toISOString().split('T')[0]
                  : '',
              });
              setShowCreateSheet(true);
            }}
          >
            Edit
          </Button>
          <Pressable
            onPress={() =>
              Alert.alert('Delete', `Delete coupon ${item.code}?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDelete(item._id, item.code),
                },
              ])
            }
            className="px-4 py-2 bg-red-50 rounded-lg active:bg-red-100"
          >
            <Text className="text-sm font-medium text-red-600">Delete</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

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
            <Text className="text-2xl font-bold text-green-600">{activeCount}</Text>
            <Text className="text-sm text-gray-600">Active</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-blue-600">{totalUses}</Text>
            <Text className="text-sm text-gray-600">Total Uses</Text>
          </View>
        </View>
      </View>

      {/* Coupons List */}
      <FlatList
        data={coupons}
        renderItem={renderCoupon}
        keyExtractor={(item) => item._id}
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

      {/* Create/Edit Coupon Bottom Sheet */}
      <BottomSheet
        visible={showCreateSheet}
        onClose={() => {
          setShowCreateSheet(false);
          setEditingCoupon(null);
          setFormData({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: '',
            applicableTo: 'services',
            maxUses: '',
            minPurchaseAmount: '',
            validFrom: Date.now(),
            validUntil: '',
          });
        }}
      >
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
          </Text>

          <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Coupon Code *</Text>
              <Input
                placeholder="e.g., SUMMER25"
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                autoCapitalize="characters"
                disabled={!!editingCoupon}
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
                  onPress={() => setFormData({ ...formData, discountType: 'fixed_amount' })}
                  className={`flex-1 py-3 rounded-lg ${
                    formData.discountType === 'fixed_amount' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      formData.discountType === 'fixed_amount' ? 'text-white' : 'text-gray-700'
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
                value={formData.minPurchaseAmount}
                onChangeText={(text) => setFormData({ ...formData, minPurchaseAmount: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Usage Limit</Text>
              <Input
                placeholder="100"
                value={formData.maxUses}
                onChangeText={(text) => setFormData({ ...formData, maxUses: text })}
                keyboardType="number-pad"
              />
            </View>

            <View className="flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onPress={() => {
                  setShowCreateSheet(false);
                  setEditingCoupon(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onPress={editingCoupon ? handleEditCoupon : handleCreateCoupon}
                className="flex-1"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
