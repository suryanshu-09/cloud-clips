import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';

interface IFeaturedBarber {
  _id: string;
  businessName: string;
  userId: string;
  isFeatured: boolean;
  featuredAt?: number;
  featuredUntil?: number;
  isExpired?: boolean;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

interface IAvailableBarber {
  _id: string;
  businessName: string;
  user?: {
    name?: string;
  };
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(timestamp: number | undefined): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FeaturedBarbersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<IFeaturedBarber | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredBarbers = useQuery(api.admin.featuredBarbers.getAllFeaturedBarbers);
  const verifiedBarbers = useQuery(api.admin.featuredBarbers.getVerifiedBarbers, {
    excludeFeatured: true,
  });

  const featureBarber = useMutation(api.admin.featuredBarbers.featureBarber);
  const unfeatureBarber = useMutation(api.admin.featuredBarbers.unfeatureBarber);
  const updateFeaturedExpiry = useMutation(api.admin.featuredBarbers.updateFeaturedExpiry);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleFeature = async (barberId: string, daysUntilExpiry: number | null) => {
    try {
      const featuredUntil = daysUntilExpiry
        ? Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000
        : undefined;
      await featureBarber({ barberProfileId: barberId as any, featuredUntil });
      setShowFeatureModal(false);
      Alert.alert('Success', 'Barber featured successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to feature barber');
    }
  };

  const handleUnfeature = async (barberId: string) => {
    Alert.alert(
      'Unfeature Barber',
      'Are you sure you want to remove this barber from featured list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfeature',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfeatureBarber({ barberProfileId: barberId as any });
              Alert.alert('Success', 'Barber unfeatured');
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to unfeature barber'
              );
            }
          },
        },
      ]
    );
  };

  const handleUpdateExpiry = async (barberId: string, daysUntilExpiry: number | null) => {
    try {
      const featuredUntil = daysUntilExpiry
        ? Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000
        : undefined;
      await updateFeaturedExpiry({ barberProfileId: barberId as any, featuredUntil });
      setShowExpiryModal(false);
      setSelectedBarber(null);
      Alert.alert('Success', 'Expiry updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update expiry');
    }
  };

  const filteredBarbers = featuredBarbers?.filter(
    (barber: IFeaturedBarber) =>
      barber.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableBarbers = verifiedBarbers?.filter(
    (barber: IAvailableBarber) =>
      barber.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (featuredBarbers === undefined) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-3">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xl font-bold text-gray-900">Featured Barbers</Text>
            <Text className="text-sm text-gray-600">Manage featured barbers on homepage</Text>
          </View>
          <Pressable
            onPress={() => setShowFeatureModal(true)}
            className="bg-purple-600 px-4 py-2 rounded-lg active:bg-purple-700"
          >
            <Text className="text-white font-semibold">+ Feature</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder="Search featured barbers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
      >
        <View className="p-4 space-y-3">
          {filteredBarbers && filteredBarbers.length > 0 ? (
            filteredBarbers.map((barber: IFeaturedBarber) => (
              <Card key={barber._id} className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {barber.businessName}
                    </Text>
                    <Text className="text-sm text-gray-600">{barber.user?.name || 'Unknown'}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View
                        className={`px-2 py-0.5 rounded-full ${barber.isExpired ? 'bg-red-100' : 'bg-green-100'}`}
                      >
                        <Text
                          className={`text-xs font-medium ${barber.isExpired ? 'text-red-700' : 'text-green-700'}`}
                        >
                          {barber.isExpired ? 'Expired' : 'Active'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end gap-2">
                    <Text className="text-xs text-gray-500">
                      Featured: {formatDate(barber.featuredAt)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Expires: {formatDate(barber.featuredUntil)}
                    </Text>
                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => {
                          setSelectedBarber(barber);
                          setShowExpiryModal(true);
                        }}
                        className="bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
                      >
                        <Text className="text-gray-700 text-sm">Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleUnfeature(barber._id)}
                        className="bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100"
                      >
                        <Text className="text-red-600 text-sm">Unfeature</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-3">⭐</Text>
              <Text className="text-lg font-semibold text-gray-900">No Featured Barbers</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Feature a barber to promote them on the homepage
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showFeatureModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-4 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Feature a Barber</Text>
              <Pressable onPress={() => setShowFeatureModal(false)} className="p-2">
                <Text className="text-gray-500 text-xl">✕</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Search barbers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900 mb-3"
              placeholderTextColor="#9ca3af"
            />
            <ScrollView className="max-h-[400px]">
              {availableBarbers && availableBarbers.length > 0 ? (
                availableBarbers.map((barber: IAvailableBarber) => (
                  <Pressable
                    key={barber._id}
                    onPress={() => {
                      Alert.alert('Feature Duration', 'How long should this barber be featured?', [
                        { text: 'Indefinite', onPress: () => handleFeature(barber._id, null) },
                        { text: '7 Days', onPress: () => handleFeature(barber._id, 7) },
                        { text: '30 Days', onPress: () => handleFeature(barber._id, 30) },
                        { text: '90 Days', onPress: () => handleFeature(barber._id, 90) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }}
                    className="p-3 border-b border-gray-100 active:bg-gray-50"
                  >
                    <Text className="text-base font-medium text-gray-900">
                      {barber.businessName}
                    </Text>
                    <Text className="text-sm text-gray-600">{barber.user?.name || 'Unknown'}</Text>
                  </Pressable>
                ))
              ) : (
                <View className="items-center py-8">
                  <Text className="text-gray-500">No available barbers to feature</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showExpiryModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-5 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-900 mb-4">Update Featured Expiry</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Current expiry: {formatDateTime(selectedBarber?.featuredUntil)}
            </Text>
            <View className="space-y-2">
              <Pressable
                onPress={() => selectedBarber && handleUpdateExpiry(selectedBarber._id, 7)}
                className="bg-gray-100 p-3 rounded-lg active:bg-gray-200"
              >
                <Text className="text-gray-900 text-center font-medium">7 Days</Text>
              </Pressable>
              <Pressable
                onPress={() => selectedBarber && handleUpdateExpiry(selectedBarber._id, 30)}
                className="bg-gray-100 p-3 rounded-lg active:bg-gray-200"
              >
                <Text className="text-gray-900 text-center font-medium">30 Days</Text>
              </Pressable>
              <Pressable
                onPress={() => selectedBarber && handleUpdateExpiry(selectedBarber._id, 90)}
                className="bg-gray-100 p-3 rounded-lg active:bg-gray-200"
              >
                <Text className="text-gray-900 text-center font-medium">90 Days</Text>
              </Pressable>
              <Pressable
                onPress={() => selectedBarber && handleUpdateExpiry(selectedBarber._id, null)}
                className="bg-gray-100 p-3 rounded-lg active:bg-gray-200"
              >
                <Text className="text-gray-900 text-center font-medium">Indefinite</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                setShowExpiryModal(false);
                setSelectedBarber(null);
              }}
              className="mt-4 py-3"
            >
              <Text className="text-gray-500 text-center">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
