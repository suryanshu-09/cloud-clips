import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarberList } from '@/components/barber/BarberList';
import { useBarberSearch, type IBarberProfile, type ServiceLocation } from '@/features/barbers';

const SPECIALTIES = [
  'Haircut',
  'Beard Trim',
  'Shave',
  'Hair Coloring',
  'Styling',
  'Fade',
  'Kids Cut',
];

const SORT_OPTIONS: { label: string; value: 'distance' | 'rating' | 'price' | 'experience' }[] = [
  { label: 'Distance', value: 'distance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Price', value: 'price' },
  { label: 'Experience', value: 'experience' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedServiceLocation, setSelectedServiceLocation] = useState<
    ServiceLocation | undefined
  >();
  const [selectedSortBy, setSelectedSortBy] = useState<
    'distance' | 'rating' | 'price' | 'experience'
  >('rating');

  const {
    data,
    isLoading,
    isError,
    error,
    updateSpecialties,
    updateServiceLocation,
    updateSortBy,
    resetFilters,
    hasActiveFilters,
    refetch,
  } = useBarberSearch({
    specialties: selectedSpecialties,
    serviceLocation: selectedServiceLocation,
    sortBy: selectedSortBy,
  });

  const handleBarberPress = (barber: IBarberProfile) => {
    router.push(`/(client)/booking/${barber.id}`);
  };

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter((s) => s !== specialty)
      : [...selectedSpecialties, specialty];
    setSelectedSpecialties(newSpecialties);
    updateSpecialties(newSpecialties);
  };

  const handleServiceLocationChange = (location: ServiceLocation) => {
    const newLocation = selectedServiceLocation === location ? undefined : location;
    setSelectedServiceLocation(newLocation);
    updateServiceLocation(newLocation);
  };

  const handleSortChange = (sortBy: 'distance' | 'rating' | 'price' | 'experience') => {
    setSelectedSortBy(sortBy);
    updateSortBy(sortBy);
  };

  const handleResetFilters = () => {
    setSelectedSpecialties([]);
    setSelectedServiceLocation(undefined);
    setSelectedSortBy('rating');
    resetFilters();
  };

  return (
    <SafeView>
      <Header title="Search Barbers" />
      <View className="flex-1">
        {/* Search Input */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <TextInput
            placeholder="Search by name or service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-gray-100 rounded-lg px-4 py-3 text-base"
          />
        </View>

        {/* Filters Section */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white border-b border-gray-200"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          {/* Service Location Filter */}
          <View className="flex-row gap-2 mr-4">
            <Pressable onPress={() => handleServiceLocationChange('in_home')}>
              <Badge
                variant={selectedServiceLocation === 'in_home' ? 'primary' : 'secondary'}
                size="md"
              >
                🏠 Home Service
              </Badge>
            </Pressable>
            <Pressable onPress={() => handleServiceLocationChange('in_salon')}>
              <Badge
                variant={selectedServiceLocation === 'in_salon' ? 'primary' : 'secondary'}
                size="md"
              >
                💈 Salon
              </Badge>
            </Pressable>
          </View>

          {/* Specialties Filter */}
          <View className="flex-row gap-2">
            {SPECIALTIES.map((specialty) => (
              <Pressable key={specialty} onPress={() => toggleSpecialty(specialty)}>
                <Badge
                  variant={selectedSpecialties.includes(specialty) ? 'primary' : 'secondary'}
                  size="md"
                >
                  {specialty}
                </Badge>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Sort By Section */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-gray-50 border-b border-gray-200"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text className="text-sm text-gray-600 mr-3">Sort by:</Text>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSortChange(option.value)}
              className="mr-2"
            >
              <Badge variant={selectedSortBy === option.value ? 'info' : 'secondary'} size="md">
                {option.label}
              </Badge>
            </Pressable>
          ))}
        </ScrollView>

        {/* Active Filters */}
        {hasActiveFilters && (
          <View className="bg-blue-50 px-6 py-3 flex-row items-center justify-between">
            <Text className="text-sm text-blue-800">
              {selectedSpecialties.length} filters active
            </Text>
            <Pressable onPress={handleResetFilters}>
              <Text className="text-sm text-blue-600 font-semibold">Clear All</Text>
            </Pressable>
          </View>
        )}

        {/* Results */}
        <BarberList
          barbers={data?.barbers || []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onBarberPress={handleBarberPress}
          onRetry={refetch}
          showDistance={selectedSortBy === 'distance'}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>
    </SafeView>
  );
}
