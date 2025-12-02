import { View, Text, Switch, Pressable } from 'react-native';
import { useState } from 'react';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface ITimeSlot {
  start: string;
  end: string;
}

interface IDaySchedule {
  enabled: boolean;
  slots: ITimeSlot[];
}

interface IAvailabilityPickerProps {
  schedule: Record<DayOfWeek, IDaySchedule>;
  onScheduleChange: (schedule: Record<DayOfWeek, IDaySchedule>) => void;
  editable?: boolean;
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function AvailabilityPicker({
  schedule,
  onScheduleChange,
  editable = true,
}: IAvailabilityPickerProps) {
  const toggleDay = (day: DayOfWeek) => {
    if (!editable) return;

    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled,
      },
    };
    onScheduleChange(newSchedule);
  };

  const updateTimeSlot = (
    day: DayOfWeek,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    if (!editable) return;

    const newSchedule = { ...schedule };
    newSchedule[day].slots[slotIndex][field] = value;
    onScheduleChange(newSchedule);
  };

  return (
    <View className="space-y-3">
      {DAYS.map(({ key, label, short }) => (
        <View
          key={key}
          className={`border rounded-lg p-4 ${
            schedule[key].enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          }`}
        >
          {/* Day Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  schedule[key].enabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${schedule[key].enabled ? 'text-white' : 'text-gray-600'}`}
                >
                  {short}
                </Text>
              </View>
              <Text className="text-base font-semibold text-gray-900">{label}</Text>
            </View>

            <Switch
              value={schedule[key].enabled}
              onValueChange={() => toggleDay(key)}
              disabled={!editable}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={schedule[key].enabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          {/* Time Slots */}
          {schedule[key].enabled && (
            <View className="space-y-2 mt-2">
              {schedule[key].slots.map((slot, index) => (
                <View key={index} className="flex-row items-center gap-2 pl-13">
                  <Pressable
                    className="flex-1 bg-white rounded-lg px-3 py-2.5 border border-gray-300"
                    disabled={!editable}
                  >
                    <Text className="text-sm text-gray-700 text-center font-medium">
                      {slot.start}
                    </Text>
                  </Pressable>
                  <Text className="text-gray-500 font-medium">-</Text>
                  <Pressable
                    className="flex-1 bg-white rounded-lg px-3 py-2.5 border border-gray-300"
                    disabled={!editable}
                  >
                    <Text className="text-sm text-gray-700 text-center font-medium">
                      {slot.end}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Unavailable Message */}
          {!schedule[key].enabled && (
            <Text className="text-sm text-gray-500 pl-13">Unavailable</Text>
          )}
        </View>
      ))}
    </View>
  );
}
