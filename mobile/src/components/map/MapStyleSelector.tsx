import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { mapStyleAtom, setMapStyleAtom } from '@/store/atoms/themeAtom';
import { AVAILABLE_MAP_STYLES, type MapStyle } from '@/config/mapStyles';
import { Ionicons } from '@expo/vector-icons';

interface IMapStyleSelectorProps {
  onStyleChange?: (style: MapStyle) => void;
  showLabels?: boolean;
  horizontal?: boolean;
}

export const MapStyleSelector: React.FC<IMapStyleSelectorProps> = ({
  onStyleChange,
  showLabels = true,
  horizontal = true,
}) => {
  const currentStyle = useAtomValue(mapStyleAtom);
  const [, setMapStyle] = useAtom(setMapStyleAtom);

  const handleStyleSelect = (style: MapStyle) => {
    setMapStyle(style);
    onStyleChange?.(style);
  };

  const getStyleIcon = (styleId: MapStyle): keyof typeof Ionicons.glyphMap => {
    switch (styleId) {
      case 'standard':
        return 'map-outline';
      case 'dark':
        return 'moon-outline';
      case 'satellite':
        return 'earth-outline';
      case 'terrain':
        return 'triangle-outline';
      default:
        return 'map-outline';
    }
  };

  const renderStyleItem = (style: (typeof AVAILABLE_MAP_STYLES)[0]) => {
    const isSelected = currentStyle === style.id;
    const iconName = getStyleIcon(style.id);

    return (
      <TouchableOpacity
        key={style.id}
        onPress={() => handleStyleSelect(style.id)}
        style={[
          styles.styleItem,
          horizontal ? styles.horizontalItem : styles.verticalItem,
          isSelected && styles.selectedItem,
        ]}
        accessibilityLabel={`${style.name} map style`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
          <Ionicons name={iconName} size={24} color={isSelected ? '#FFFFFF' : '#6B7280'} />
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          )}
        </View>
        {showLabels && (
          <View style={styles.textContainer}>
            <Text style={[styles.styleName, isSelected && styles.selectedText]}>{style.name}</Text>
            <Text style={styles.styleDescription} numberOfLines={1}>
              {style.description}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Style</Text>
      <ScrollView
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.horizontalContent : styles.verticalContent}
      >
        {AVAILABLE_MAP_STYLES.map(renderStyleItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  horizontalContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  verticalContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  horizontalItem: {
    marginRight: 8,
    minWidth: 140,
  },
  verticalItem: {
    marginBottom: 8,
  },
  selectedItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  selectedIconContainer: {
    backgroundColor: '#3B82F6',
  },
  checkmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedText: {
    color: '#3B82F6',
  },
  styleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default MapStyleSelector;
