import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { searchRadiusAtom, setSearchRadiusAtom } from '@/store/atoms/locationAtom';
import { Ionicons } from '@expo/vector-icons';
import { MAX_SEARCH_RADIUS } from '@/utils/constants';

interface ISearchRadiusSelectorProps {
  onRadiusChange?: (radius: number) => void;
  minRadius?: number;
  maxRadius?: number;
  step?: number;
  showLabels?: boolean;
  presetValues?: number[];
}

const DEFAULT_PRESETS = [1, 3, 5, 10, 25, 50];

export const SearchRadiusSelector: React.FC<ISearchRadiusSelectorProps> = ({
  onRadiusChange,
  minRadius = 1,
  maxRadius = MAX_SEARCH_RADIUS,
  step = 1,
  showLabels = true,
  presetValues = DEFAULT_PRESETS,
}) => {
  const currentRadius = useAtomValue(searchRadiusAtom);
  const [, setRadius] = useAtom(setSearchRadiusAtom);

  const handleRadiusSelect = useCallback(
    (radius: number) => {
      const clampedRadius = Math.max(minRadius, Math.min(radius, maxRadius));
      setRadius(clampedRadius);
      onRadiusChange?.(clampedRadius);
    },
    [minRadius, maxRadius, onRadiusChange, setRadius]
  );

  const handleIncrement = useCallback(() => {
    const newRadius = Math.min(currentRadius + step, maxRadius);
    handleRadiusSelect(newRadius);
  }, [currentRadius, step, maxRadius, handleRadiusSelect]);

  const handleDecrement = useCallback(() => {
    const newRadius = Math.max(currentRadius - step, minRadius);
    handleRadiusSelect(newRadius);
  }, [currentRadius, step, minRadius, handleRadiusSelect]);

  const getRadiusLabel = (radius: number): string => {
    if (radius < 1) {
      return `${Math.round(radius * 1000)}m`;
    }
    return `${radius}mi`;
  };

  const filteredPresets = presetValues.filter((value) => value >= minRadius && value <= maxRadius);

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.header}>
          <Ionicons name="navigate-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.title}>Search Radius</Text>
          <View style={styles.currentRadiusBadge}>
            <Text style={styles.currentRadiusText}>{getRadiusLabel(currentRadius)}</Text>
          </View>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={currentRadius <= minRadius}
          style={[styles.controlButton, currentRadius <= minRadius && styles.controlButtonDisabled]}
          accessibilityLabel="Decrease search radius"
          accessibilityRole="button"
        >
          <Ionicons
            name="remove"
            size={24}
            color={currentRadius <= minRadius ? '#9CA3AF' : '#3B82F6'}
          />
        </TouchableOpacity>

        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              {
                width: `${((currentRadius - minRadius) / (maxRadius - minRadius)) * 100}%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          disabled={currentRadius >= maxRadius}
          style={[styles.controlButton, currentRadius >= maxRadius && styles.controlButtonDisabled]}
          accessibilityLabel="Increase search radius"
          accessibilityRole="button"
        >
          <Ionicons
            name="add"
            size={24}
            color={currentRadius >= maxRadius ? '#9CA3AF' : '#3B82F6'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.presetsContainer}>
        {filteredPresets.map((preset) => {
          const isSelected = currentRadius === preset;
          return (
            <TouchableOpacity
              key={preset}
              onPress={() => handleRadiusSelect(preset)}
              style={[styles.presetButton, isSelected && styles.presetButtonSelected]}
              accessibilityLabel={`Set radius to ${getRadiusLabel(preset)}`}
              accessibilityState={{ selected: isSelected }}
              accessibilityRole="button"
            >
              <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                {getRadiusLabel(preset)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.helperText}>
        Adjust the distance to find barbers within {getRadiusLabel(currentRadius)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  currentRadiusBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  currentRadiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controlButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  presetTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SearchRadiusSelector;
