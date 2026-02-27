import { useState, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { atom } from 'jotai';

import { DateTimePicker } from '@/components/booking';
import { Button } from '@/components/ui';
import { useAvailability } from '@/features/bookings';
import type { IBookingSchedule } from '@/features/bookings';
import { bookingFormAtom } from './form';

// Atom to store selected date/time as timestamps
export const bookingScheduleAtom = atom<IBookingSchedule>({});

export default function ScheduleScreen() {
  const router = useRouter();
  const [bookingForm] = useAtom(bookingFormAtom);
  const [bookingSchedule, setBookingSchedule] = useAtom(bookingScheduleAtom);

  const [selectedDate, setSelectedDate] = useState<number | undefined>(
    bookingSchedule.selectedDate
  );
  const [selectedTime, setSelectedTime] = useState<number | undefined>(
    bookingSchedule.selectedTime
  );

  // Fetch availability for the selected date from Convex
  const { availableSlots, isLoading: isSlotsLoading } = useAvailability({
    barberId: bookingForm.barberId,
    date: selectedDate,
    enabled: !!bookingForm.barberId && selectedDate !== undefined,
  });

  const handleDateSelect = useCallback((dateTimestamp: number) => {
    setSelectedDate(dateTimestamp);
    // Clear time selection when date changes
    setSelectedTime(undefined);
  }, []);

  const handleTimeSelect = useCallback((timeTimestamp: number) => {
    setSelectedTime(timeTimestamp);
  }, []);

  const handleContinue = () => {
    if (!selectedTime || !selectedDate) return;

    // Save schedule data as timestamps
    setBookingSchedule({
      selectedDate,
      selectedTime,
    });

    // Navigate to checkout
    router.push('/booking/checkout');
  };

  const isValid = selectedTime !== undefined;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Choose Date & Time</Text>
        <Text className="text-gray-600">Select your preferred appointment time</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            availableSlots={availableSlots}
            isSlotsLoading={isSlotsLoading}
          />
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleContinue} disabled={!isValid} size="lg">
          Continue to Checkout
        </Button>
      </View>
    </View>
  );
}
