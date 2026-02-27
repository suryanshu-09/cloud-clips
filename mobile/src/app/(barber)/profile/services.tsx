import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const SERVICE_CATEGORIES = [
  'Haircut',
  'Beard & Shave',
  'Color',
  'Treatment',
  'Kids',
  'Other',
];

interface IServiceForm {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
}

const EMPTY_FORM: IServiceForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  duration: '',
  category: 'Haircut',
};

function ServiceModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: IServiceForm | null;
  onClose: () => void;
  onSave: (service: IServiceForm) => void;
}) {
  const [form, setForm] = useState<IServiceForm>(initial || EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof IServiceForm, string>>>({});

  // Reset form when initial changes
  useState(() => {
    setForm(initial || EMPTY_FORM);
    setErrors({});
  });

  const validate = () => {
    const newErrors: Partial<Record<keyof IServiceForm, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Service name is required';
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price) || price <= 0) newErrors.price = 'Enter a valid price';
    const duration = parseInt(form.duration);
    if (!form.duration || isNaN(duration) || duration <= 0) newErrors.duration = 'Enter a valid duration in minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(form);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">
              {initial?.id ? 'Edit Service' : 'Add Service'}
            </Text>
            <Pressable onPress={onClose} className="w-8 h-8 items-center justify-center">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
            <View className="mb-4">
              <Input
                label="Service Name *"
                placeholder="e.g. Classic Haircut"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                error={errors.name}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Description"
                placeholder="Brief description of the service"
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Input
                  label="Price ($) *"
                  placeholder="25.00"
                  value={form.price}
                  onChangeText={(t) => setForm({ ...form, price: t })}
                  keyboardType="decimal-pad"
                  error={errors.price}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Duration (min) *"
                  placeholder="30"
                  value={form.duration}
                  onChangeText={(t) => setForm({ ...form, duration: t })}
                  keyboardType="number-pad"
                  error={errors.duration}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm({ ...form, category: cat })}
                      className={`px-4 py-2 rounded-full border ${
                        form.category === cat
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          form.category === cat ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          <View className="px-6 pb-8 pt-4 border-t border-gray-100">
            <Button onPress={handleSave}>
              {initial?.id ? 'Save Changes' : 'Add Service'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ServicesScreen() {
  const profile = useQuery(api.barbers.queries.getBarberProfile);
  const updateProfile = useMutation(api.barbers.mutations.updateBarberProfile);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<IServiceForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const services = profile?.services || [];

  const handleAddService = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleEditService = (service: (typeof services)[0]) => {
    setEditingService({
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
    });
    setShowModal(true);
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    Alert.alert(
      'Delete Service',
      `Remove "${serviceName}" from your services?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              const updated = services.filter((s) => s.id !== serviceId);
              await updateProfile({ services: updated });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete service');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveService = async (form: IServiceForm) => {
    try {
      setIsSaving(true);
      setShowModal(false);

      const serviceData = {
        id: form.id || `svc_${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        category: form.category,
      };

      let updated;
      if (form.id) {
        // Edit existing
        updated = services.map((s) => (s.id === form.id ? serviceData : s));
      } else {
        // Add new
        updated = [...services, serviceData];
      }

      await updateProfile({ services: updated });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <SafeView>
        <Header title="Service Pricing" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      <Header title="Service Pricing" showBack />

      <ScrollView className="flex-1 bg-gray-50">
        {/* Header info */}
        <View className="bg-white px-4 py-4 mb-4 border-b border-gray-100">
          <Text className="text-gray-600 text-sm">
            Manage the services you offer and their prices. Clients see these when booking.
          </Text>
        </View>

        {services.length === 0 ? (
          <View className="mx-4 mt-4">
            <Card variant="outlined" padding="lg">
              <View className="items-center py-8">
                <Ionicons name="cut-outline" size={48} color="#d1d5db" />
                <Text className="text-lg font-bold text-gray-900 mt-4 mb-2">No services yet</Text>
                <Text className="text-gray-500 text-center mb-6">
                  Add your first service to start accepting bookings
                </Text>
                <Button onPress={handleAddService}>Add First Service</Button>
              </View>
            </Card>
          </View>
        ) : (
          <View className="px-4">
            {services.map((service) => (
              <View
                key={service.id}
                className="bg-white rounded-xl mb-3 p-4 border border-gray-100"
              >
                <View className="flex-row items-start justify-between mb-1">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-gray-900">{service.name}</Text>
                    {service.description ? (
                      <Text className="text-sm text-gray-500 mt-1">{service.description}</Text>
                    ) : null}
                  </View>
                  <Text className="text-lg font-bold text-indigo-600">
                    ${service.price.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row items-center mt-2 mb-3">
                  <View className="flex-row items-center mr-4">
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-500 ml-1">{service.duration} min</Text>
                  </View>
                  <View className="bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-indigo-700 font-medium">{service.category}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 border-t border-gray-100 pt-3">
                  <Pressable
                    onPress={() => handleEditService(service)}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg border border-indigo-200 bg-indigo-50 active:bg-indigo-100"
                  >
                    <Ionicons name="pencil-outline" size={16} color="#6366f1" />
                    <Text className="text-sm font-medium text-indigo-600 ml-1">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteService(service.id, service.name)}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg border border-red-200 bg-red-50 active:bg-red-100"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text className="text-sm font-medium text-red-500 ml-1">Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="px-4 pb-8 mt-2">
          <Button
            onPress={handleAddService}
            variant="outline"
            disabled={isSaving}
            loading={isSaving}
          >
            + Add Service
          </Button>
        </View>
      </ScrollView>

      <ServiceModal
        visible={showModal}
        initial={editingService}
        onClose={() => setShowModal(false)}
        onSave={handleSaveService}
      />
    </SafeView>
  );
}
