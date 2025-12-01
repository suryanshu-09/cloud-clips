/**
 * HaircutSelector Component
 * Allows users to select their hair type for the appointment
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import type { HairType } from '@/features/bookings/types';

interface IHaircutSelectorProps {
  selected?: HairType;
  onSelect: (hairType: HairType) => void;
  disabled?: boolean;
}

const hairTypes: {
  type: HairType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'straight',
    label: 'Straight Hair',
    description: 'Fine, straight texture',
    icon: '━━━',
  },
  {
    type: 'wavy',
    label: 'Wavy Hair',
    description: 'Loose waves and texture',
    icon: '∼∼∼',
  },
  {
    type: 'curly',
    label: 'Curly Hair',
    description: 'Tight curls and coils',
    icon: '◯◯◯',
  },
];

export function HaircutSelector({ selected, onSelect, disabled = false }: IHaircutSelectorProps) {
  return (
    <View className="gap-4">
      <View>
        <Text className="text-lg font-semibold text-gray-900 mb-1">Hair Type</Text>
        <Text className="text-sm text-gray-600">Select your hair type for the best service</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-3"
        contentContainerClassName="gap-3"
      >
        {hairTypes.map((hairType) => {
          const isSelected = selected === hairType.type;

          return (
            <Pressable
              key={hairType.type}
              onPress={() => !disabled && onSelect(hairType.type)}
              disabled={disabled}
              className={`
                w-32 p-4 rounded-xl border-2
                ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                ${disabled ? 'opacity-50' : 'active:scale-95'}
              `}
            >
              <View className="items-center gap-2">
                <Text className="text-3xl">{hairType.icon}</Text>
                <Text
                  className={`text-sm font-semibold text-center ${
                    isSelected ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {hairType.label}
                </Text>
                <Text className="text-xs text-gray-600 text-center">{hairType.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
