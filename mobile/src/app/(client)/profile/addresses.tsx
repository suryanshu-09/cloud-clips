import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAddresses } from '@/features/products/hooks/useAddresses';

interface IAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface IAddressFormData {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const INITIAL_FORM_DATA: IAddressFormData = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
};

interface IAddressCardProps {
  address: IAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
  isDeleting,
}: IAddressCardProps) {
  const handleDelete = () => {
    if (address.isDefault) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete your default address. Please set another address as default first.'
      );
      return;
    }
    Alert.alert('Delete Address', `Are you sure you want to delete "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  return (
    <Card variant="elevated" padding="md" className="mb-3">
      <View className="flex-row items-start">
        {/* Icon */}
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
          <Ionicons
            name={address.label.toLowerCase() === 'home' ? 'home' : 'location'}
            size={20}
            color="#2563EB"
          />
        </View>

        {/* Address Details */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-semibold text-gray-900">{address.label}</Text>
            {address.isDefault && (
              <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                <Text className="text-xs font-medium text-green-700">Default</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-600">{address.line1}</Text>
          {address.line2 && <Text className="text-sm text-gray-600">{address.line2}</Text>}
          <Text className="text-sm text-gray-600">
            {address.city}, {address.state} {address.zip}
          </Text>
          <Text className="text-sm text-gray-500">{address.country}</Text>
        </View>

        {/* Actions Menu */}
        <View className="flex-col items-end">
          <Pressable onPress={onEdit} className="p-2">
            <Ionicons name="create-outline" size={20} color="#6B7280" />
          </Pressable>
          {!address.isDefault && (
            <Pressable onPress={onSetDefault} disabled={isSettingDefault} className="p-2">
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

interface IAddressFormProps {
  initialData?: IAddressFormData;
  onSubmit: (data: IAddressFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

function AddressForm({
  initialData = INITIAL_FORM_DATA,
  onSubmit,
  onCancel,
  isSubmitting,
  isEdit = false,
}: IAddressFormProps) {
  const [formData, setFormData] = useState<IAddressFormData>(initialData);

  const handleSubmit = () => {
    // Validation
    if (!formData.label.trim()) {
      Alert.alert('Error', 'Please enter a label for this address');
      return;
    }
    if (!formData.line1.trim()) {
      Alert.alert('Error', 'Please enter a street address');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter a state');
      return;
    }
    if (!formData.zip.trim()) {
      Alert.alert('Error', 'Please enter a ZIP code');
      return;
    }

    onSubmit(formData);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="max-h-96">
        <View className="mb-3">
          <Input
            label="Label"
            placeholder="e.g., Home, Work, Office"
            value={formData.label}
            onChangeText={(text) => setFormData({ ...formData, label: text })}
          />
        </View>

        <View className="mb-3">
          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={formData.line1}
            onChangeText={(text) => setFormData({ ...formData, line1: text })}
          />
        </View>

        <View className="mb-3">
          <Input
            label="Apt, Suite, etc. (optional)"
            placeholder="Apt 4B"
            value={formData.line2}
            onChangeText={(text) => setFormData({ ...formData, line2: text })}
          />
        </View>

        <View className="mb-3">
          <Input
            label="City"
            placeholder="New York"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
          />
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <Input
              label="State"
              placeholder="NY"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <View className="flex-1 ml-2">
            <Input
              label="ZIP Code"
              placeholder="10001"
              value={formData.zip}
              onChangeText={(text) => setFormData({ ...formData, zip: text })}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <View className="mb-3">
          <Input label="Country" value={formData.country} editable={false} disabled />
        </View>
      </ScrollView>

      <View className="flex-row mt-4">
        <Button variant="ghost" onPress={onCancel} className="flex-1 mr-2">
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          className="flex-1 ml-2"
        >
          {isEdit ? 'Update' : 'Add Address'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AddressesScreen() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    addresses,
    isLoading,
    refetch,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddAddress = async (data: IAddressFormData) => {
    try {
      setSubmitting(true);
      await addAddress({
        label: data.label,
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        state: data.state,
        zipCode: data.zip,
        country: data.country,
      });
      setShowAddModal(false);
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAddress = async (data: IAddressFormData) => {
    if (!editingAddress) return;
    try {
      setSubmitting(true);
      await updateAddress(editingAddress.id, {
        label: data.label,
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        state: data.state,
        zipCode: data.zip,
        country: data.country,
      });
      setEditingAddress(null);
      Alert.alert('Success', 'Address updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      Alert.alert('Success', 'Address deleted successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  if (isLoading) {
    return (
      <SafeView>
        <View className="bg-white p-6 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Addresses</Text>
        </View>
        <ScrollView className="flex-1 bg-gray-50 p-4">
          <Skeleton height={120} className="mb-3 rounded-xl" />
          <Skeleton height={120} className="mb-3 rounded-xl" />
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
          <Text className="text-2xl font-bold text-gray-900">Addresses</Text>
        </View>
        <Text className="text-gray-600 ml-10">Manage your saved addresses</Text>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Addresses List */}
          {addresses.length === 0 ? (
            <View className="py-12">
              <EmptyState
                icon="location-outline"
                title="No Addresses Saved"
                description="Add an address for in-home services or faster checkout"
              />
            </View>
          ) : (
            <View className="mb-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => setEditingAddress(address)}
                  onDelete={() => handleDeleteAddress(address.id)}
                  onSetDefault={() => handleSetDefault(address.id)}
                  isSettingDefault={submitting}
                  isDeleting={submitting}
                />
              ))}
            </View>
          )}

          {/* Add New Address Button */}
          <Button variant="outline" size="lg" fullWidth onPress={() => setShowAddModal(true)}>
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text className="text-blue-600 font-semibold ml-2">Add New Address</Text>
            </View>
          </Button>

          {/* Info Section */}
          <Card variant="outlined" padding="md" className="mt-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Address Usage</Text>
                <Text className="text-sm text-gray-600">
                  Your default address will be used for in-home barber services and product
                  deliveries.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Address"
        size="lg"
      >
        <AddressForm
          onSubmit={handleAddAddress}
          onCancel={() => setShowAddModal(false)}
          isSubmitting={submitting}
        />
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        visible={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        title="Edit Address"
        size="lg"
      >
        {editingAddress && (
          <AddressForm
            initialData={{
              label: editingAddress.label,
              line1: editingAddress.line1,
              line2: editingAddress.line2 || '',
              city: editingAddress.city,
              state: editingAddress.state,
              zip: editingAddress.zip,
              country: editingAddress.country,
            }}
            onSubmit={handleUpdateAddress}
            onCancel={() => setEditingAddress(null)}
            isSubmitting={submitting}
            isEdit
          />
        )}
      </Modal>
    </SafeView>
  );
}
