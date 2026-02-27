import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  filterAtom,
  setPriceRangeAtom,
  setMinRatingAtom,
  toggleSpecialtyAtom,
  clearFiltersAtom,
  activeFiltersCountAtom,
  type IFilterState,
} from '@/store/atoms/filterAtom';

interface IFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  availableSpecialties?: string[];
  onApplyFilters?: (filters: IFilterState) => void;
}

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100+', min: 100, max: 1000 },
];

const RATING_OPTIONS = [
  { value: 5, label: '5 stars' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
];

const DEFAULT_SPECIALTIES = [
  'Fades',
  'Beard Grooming',
  'Hot Towel Shave',
  'Hair Coloring',
  'Designs',
  'Straight Razor',
  'Scalp Treatment',
  'Kids Haircuts',
  'Line Ups',
  'Texturizing',
  'Buzz Cut',
  'Classic Cuts',
];

export const FilterBottomSheet: React.FC<IFilterBottomSheetProps> = ({
  visible,
  onClose,
  availableSpecialties,
  onApplyFilters,
}) => {
  const [filters] = useAtom(filterAtom);
  const [, setPriceRange] = useAtom(setPriceRangeAtom);
  const [, setMinRating] = useAtom(setMinRatingAtom);
  const [, toggleSpecialty] = useAtom(toggleSpecialtyAtom);
  const [, clearFilters] = useAtom(clearFiltersAtom);
  const activeCount = useAtomValue(activeFiltersCountAtom);

  const specialties = useMemo(
    () => availableSpecialties || DEFAULT_SPECIALTIES,
    [availableSpecialties]
  );

  const handlePriceRangeSelect = useCallback(
    (range: { min: number; max: number } | null) => {
      setPriceRange(range);
    },
    [setPriceRange]
  );

  const handleRatingSelect = useCallback(
    (rating: number | null) => {
      setMinRating(rating);
    },
    [setMinRating]
  );

  const handleSpecialtyToggle = useCallback(
    (specialty: string) => {
      toggleSpecialty(specialty);
    },
    [toggleSpecialty]
  );

  const handleClearAll = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleApply = useCallback(() => {
    onApplyFilters?.(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const isPriceRangeSelected = useCallback(
    (range: { min: number; max: number }) => {
      return filters.priceRange?.min === range.min && filters.priceRange?.max === range.max;
    },
    [filters.priceRange]
  );

  const renderStars = (count: number) => {
    return (
      <View className="flex-row">
        {[...Array(5)].map((_, index) => (
          <Ionicons
            key={index}
            name={index < count ? 'star' : 'star-outline'}
            size={16}
            color={index < count ? '#FBBF24' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter Barbers"
      snapPoints={[0.7, 0.9]}
      showHandle
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Active Filters Badge */}
        {activeCount > 0 && (
          <View className="flex-row items-center justify-between mb-4 bg-indigo-50 p-3 rounded-lg">
            <Text className="text-indigo-700 font-medium">
              {activeCount} active filter{activeCount !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text className="text-indigo-600 font-semibold">Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Price Range Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cash-outline" size={20} color="#4B5563" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Price Range</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {PRICE_RANGES.map((range) => {
              const isSelected = isPriceRangeSelected(range);
              return (
                <TouchableOpacity
                  key={range.label}
                  onPress={() => handlePriceRangeSelect(isSelected ? null : range)}
                  className={`px-4 py-2.5 rounded-full border ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-100 border-gray-200'
                  }`}
                  accessibilityLabel={`Set price range to ${range.label}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="button"
                >
                  <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Rating Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="star-outline" size={20} color="#4B5563" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Minimum Rating</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {RATING_OPTIONS.map((option) => {
              const isSelected = filters.minRating === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleRatingSelect(isSelected ? null : option.value)}
                  className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-100 border-gray-200'
                  }`}
                  accessibilityLabel={`Set minimum rating to ${option.label}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="button"
                >
                  {renderStars(option.value)}
                  <Text
                    className={`font-medium ml-2 ${isSelected ? 'text-white' : 'text-gray-700'}`}
                  >
                    & Up
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Specialties Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cut-outline" size={20} color="#4B5563" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Specialties</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {specialties.map((specialty) => {
              const isSelected = filters.specialties.includes(specialty);
              return (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => handleSpecialtyToggle(specialty)}
                  className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-100 border-gray-200'
                  }`}
                  accessibilityLabel={`Toggle specialty ${specialty}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="button"
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {specialty}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex-row gap-3">
        <TouchableOpacity
          onPress={handleClearAll}
          className="flex-1 py-3 px-4 rounded-xl bg-gray-100 items-center"
          accessibilityLabel="Clear all filters"
          accessibilityRole="button"
        >
          <Text className="text-gray-700 font-semibold text-base">Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleApply}
          className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 items-center"
          accessibilityLabel="Apply filters"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold text-base">
            Apply {activeCount > 0 && `(${activeCount})`}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

export default FilterBottomSheet;
