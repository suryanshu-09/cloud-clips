import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePaymentMethods, type IPaymentMethod } from '@/features/payments';

interface ICardBrandIconProps {
  brand: string;
  size?: number;
}

function CardBrandIcon({ brand, size = 32 }: ICardBrandIconProps) {
  const brandColors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
    default: '#6B7280',
  };

  const brandLabels: Record<string, string> = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
    discover: 'DISC',
    default: 'CARD',
  };

  const color = brandColors[brand.toLowerCase()] || brandColors.default;
  const label = brandLabels[brand.toLowerCase()] || brandLabels.default;

  return (
    <View
      style={{
        width: size * 1.5,
        height: size,
        backgroundColor: color,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: 'white', fontSize: size * 0.35, fontWeight: 'bold' }}>{label}</Text>
    </View>
  );
}

interface IPaymentMethodCardProps {
  method: IPaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}

function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
  isSettingDefault,
  isDeleting,
}: IPaymentMethodCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to remove the card ending in ${method.card?.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <Card variant="elevated" padding="md" className="mb-3">
      <View className="flex-row items-center">
        {/* Card Brand Icon */}
        <CardBrandIcon brand={method.card?.brand || 'default'} />

        {/* Card Details */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-gray-900 capitalize">
              {method.card?.brand || 'Card'}
            </Text>
            {method.isDefault && (
              <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded">
                <Text className="text-xs font-medium text-blue-700">Default</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-600 mt-1">**** **** **** {method.card?.last4}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Expires {method.card?.expiryMonth?.toString().padStart(2, '0')}/
            {method.card?.expiryYear?.toString().slice(-2)}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row items-center">
          {!method.isDefault && (
            <Pressable onPress={onSetDefault} disabled={isSettingDefault} className="p-2 mr-1">
              <Ionicons
                name="star-outline"
                size={20}
                color={isSettingDefault ? '#9CA3AF' : '#6B7280'}
              />
            </Pressable>
          )}
          <Pressable onPress={handleDelete} disabled={isDeleting} className="p-2">
            <Ionicons name="trash-outline" size={20} color={isDeleting ? '#FCA5A5' : '#EF4444'} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    isAdding,
    removePaymentMethod,
    isRemoving,
    setDefaultPaymentMethod,
    isSettingDefault,
  } = usePaymentMethods();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would refetch the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddCard = () => {
    // In a real implementation, this would open a Stripe CardField
    // and call addPaymentMethod with the token
    // For now, we show a placeholder message
    Alert.alert(
      'Add Payment Method',
      'Stripe integration required. This will open a secure card input form in production.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Test Card',
          onPress: () => {
            // Simulate adding a test payment method
            addPaymentMethod('pm_test_' + Date.now());
            setShowAddModal(false);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeView>
        <View className="bg-white p-6 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Payment Methods</Text>
        </View>
        <ScrollView className="flex-1 bg-gray-50 p-4">
          <Skeleton height={100} className="mb-3 rounded-xl" />
          <Skeleton height={100} className="mb-3 rounded-xl" />
          <Skeleton height={100} className="rounded-xl" />
        </ScrollView>
      </SafeView>
    );
  }

  return (
    <SafeView>
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Payment Methods</Text>
        </View>
        <Text className="text-gray-600 ml-10">Manage your saved payment methods</Text>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Payment Methods List */}
          {paymentMethods.length === 0 ? (
            <View className="py-12">
              <EmptyState
                icon="card-outline"
                title="No Payment Methods"
                description="Add a card to make payments quick and easy"
              />
            </View>
          ) : (
            <View className="mb-4">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={() => setDefaultPaymentMethod(method.id)}
                  onDelete={() => removePaymentMethod(method.id)}
                  isSettingDefault={isSettingDefault}
                  isDeleting={isRemoving}
                />
              ))}
            </View>
          )}

          {/* Add New Card Button */}
          <Button variant="outline" size="lg" fullWidth onPress={() => setShowAddModal(true)}>
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text className="text-blue-600 font-semibold ml-2">Add New Card</Text>
            </View>
          </Button>

          {/* Info Section */}
          <Card variant="outlined" padding="md" className="mt-6">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Secure Payments</Text>
                <Text className="text-sm text-gray-600">
                  Your card information is encrypted and securely stored. We never store your full
                  card number.
                </Text>
              </View>
            </View>
          </Card>

          {/* Accepted Cards */}
          <View className="mt-6 items-center">
            <Text className="text-sm text-gray-500 mb-3">Accepted Cards</Text>
            <View className="flex-row space-x-3">
              <CardBrandIcon brand="visa" size={24} />
              <CardBrandIcon brand="mastercard" size={24} />
              <CardBrandIcon brand="amex" size={24} />
              <CardBrandIcon brand="discover" size={24} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Card">
        <View>
          <Text className="text-gray-600 mb-4">
            In production, this will show a secure Stripe card input form.
          </Text>

          {/* Placeholder inputs for demo */}
          <View className="mb-4">
            <Input
              label="Card Number"
              placeholder="4242 4242 4242 4242"
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Input label="Expiry" placeholder="MM/YY" keyboardType="numeric" maxLength={5} />
            </View>
            <View className="flex-1 ml-2">
              <Input
                label="CVC"
                placeholder="123"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View className="flex-row mt-4">
            <Button variant="ghost" onPress={() => setShowAddModal(false)} className="flex-1 mr-2">
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleAddCard}
              loading={isAdding}
              className="flex-1 ml-2"
            >
              Add Card
            </Button>
          </View>
        </View>
      </Modal>
    </SafeView>
  );
}
