import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { DateTimePicker } from '@/components/booking';
import { Button } from '@/components/ui';
import { useWeekAvailability } from '@/features/bookings';
import { bookingFormAtom } from './form';

// Atom to store selected date/time
import { atom } from 'jotai';

export const bookingScheduleAtom = atom<{
  selectedDate?: Date;
  selectedTime?: Date;
}>({});

export default function ScheduleScreen() {
  const router = useRouter();
  const [bookingForm] = useAtom(bookingFormAtom);
  const [bookingSchedule, setBookingSchedule] = useAtom(bookingScheduleAtom);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(bookingSchedule.selectedDate);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(bookingSchedule.selectedTime);

  // Fetch availability for the barber
  // Default duration to 60 minutes if not specified
  const serviceDuration = 60;
  const { availability, isLoading } = useWeekAvailability(
    bookingForm.barberId || '',
    serviceDuration,
    {
      enabled: !!bookingForm.barberId,
    }
  );

  const handleContinue = () => {
    if (!selectedTime) return;

    // Save schedule data
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
            availability={availability || []}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            isLoading={isLoading}
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
