/**
 * DateTimePicker Component
 * Custom date and time picker for appointment scheduling
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import type { TimeSlot, AvailabilityDay } from '@/features/bookings/types';

interface IDateTimePickerProps {
  availability?: AvailabilityDay[];
  selectedDate?: Date;
  selectedTime?: Date;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: Date) => void;
  isLoading?: boolean;
}

export function DateTimePicker({
  availability = [],
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  isLoading = false,
}: IDateTimePickerProps) {
  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const selectedDayAvailability = useMemo(() => {
    if (!selectedDate) return undefined;
    return availability.find((day) => day.date.toDateString() === selectedDate.toDateString());
  }, [availability, selectedDate]);

  if (isLoading) {
    return (
      <View className="gap-4 py-4">
        <View className="h-20 bg-gray-200 rounded-lg" />
        <View className="h-32 bg-gray-200 rounded-lg" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Date Selection */}
      <View>
        <Text className="text-lg font-semibold text-gray-900 mb-3">Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="gap-2"
          contentContainerClassName="gap-2"
        >
          {availability.map((day) => {
            const isSelected =
              selectedDate && day.date.toDateString() === selectedDate.toDateString();
            const hasSlots = day.slots.some((slot) => slot.available);

            return (
              <Pressable
                key={day.date.toISOString()}
                onPress={() => hasSlots && onDateSelect(day.date)}
                disabled={!hasSlots}
                className={`
                  px-4 py-3 rounded-lg border-2 min-w-[100px]
                  ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                  ${!hasSlots ? 'opacity-50' : 'active:scale-95'}
                `}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    isSelected ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {formatDate(day.date)}
                </Text>
                <Text className="text-xs text-gray-600 text-center mt-1">
                  {day.slots.filter((slot) => slot.available).length} slots
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Selection */}
      {selectedDate && selectedDayAvailability && (
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select Time</Text>
          <View className="flex-row flex-wrap gap-2">
            {selectedDayAvailability.slots.map((slot) => {
              const isSelected = selectedTime && slot.time.getTime() === selectedTime.getTime();

              return (
                <Pressable
                  key={slot.time.toISOString()}
                  onPress={() => slot.available && onTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`
                    px-4 py-2.5 rounded-lg border-2
                    ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                    ${!slot.available ? 'opacity-50' : 'active:scale-95'}
                  `}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedDayAvailability.slots.every((slot) => !slot.available) && (
            <View className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-600 text-center">
                No available time slots for this date
              </Text>
            </View>
          )}
        </View>
      )}

      {!selectedDate && availability.length > 0 && (
        <View className="mt-2 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm text-blue-600 text-center">
            Select a date to view available time slots
          </Text>
        </View>
      )}

      {availability.length === 0 && !isLoading && (
        <View className="mt-2 p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm text-gray-600 text-center">
            No availability found for this barber
          </Text>
        </View>
      )}
    </View>
  );
}
