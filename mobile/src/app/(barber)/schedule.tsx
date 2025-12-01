import { useState } from 'react';
import { ScrollView, Text, View, Switch, Alert } from 'react-native';
import { Button, Card } from '@/components/ui';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_SCHEDULE: Record<DayOfWeek, DaySchedule> = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: true, slots: [{ start: '10:00', end: '16:00' }] },
  sunday: { enabled: false, slots: [{ start: '10:00', end: '14:00' }] },
};

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<Record<DayOfWeek, DaySchedule>>(DEFAULT_SCHEDULE);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // TODO: Implement API call to save schedule
      // await barberService.updateSchedule(schedule);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Your schedule has been updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPreset = (preset: 'weekdays' | 'everyday' | 'weekends') => {
    const newSchedule = { ...schedule };

    DAYS.forEach(({ key }) => {
      if (preset === 'weekdays') {
        newSchedule[key].enabled = !['saturday', 'sunday'].includes(key);
      } else if (preset === 'everyday') {
        newSchedule[key].enabled = true;
      } else if (preset === 'weekends') {
        newSchedule[key].enabled = ['saturday', 'sunday'].includes(key);
      }
    });

    setSchedule(newSchedule);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">My Schedule</Text>
        <Text className="text-gray-600">Manage your weekly availability</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Quick Presets */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Presets</Text>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickPreset('weekdays')}
                className="flex-1"
              >
                Weekdays
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickPreset('weekends')}
                className="flex-1"
              >
                Weekends
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleQuickPreset('everyday')}
                className="flex-1"
              >
                Everyday
              </Button>
            </View>
          </Card>

          {/* Weekly Schedule */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</Text>
            <View className="space-y-4">
              {DAYS.map(({ key, label }) => (
                <View key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-gray-900">{label}</Text>
                    <Switch
                      value={schedule[key].enabled}
                      onValueChange={() => toggleDay(key)}
                      trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                      thumbColor={schedule[key].enabled ? '#FFFFFF' : '#F3F4F6'}
                    />
                  </View>

                  {schedule[key].enabled && (
                    <View className="ml-4 space-y-2">
                      {schedule[key].slots.map((slot, index) => (
                        <View key={index} className="flex-row items-center gap-2">
                          <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                            <Text className="text-sm text-gray-700 text-center">{slot.start}</Text>
                          </View>
                          <Text className="text-gray-500">to</Text>
                          <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                            <Text className="text-sm text-gray-700 text-center">{slot.end}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Card>

          {/* Break Times */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Break Times</Text>
            <Text className="text-gray-600 mb-3">Set your lunch or break times (coming soon)</Text>
            <Button variant="outline" disabled>
              Add Break Time
            </Button>
          </Card>

          {/* Time Off */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Time Off</Text>
            <Text className="text-gray-600 mb-3">Block specific dates when you're unavailable</Text>
            <Button variant="outline" disabled>
              Add Time Off
            </Button>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Text className="text-sm text-gray-700">
              💡 Your availability will be shown to clients when they book appointments. Make sure
              to update this regularly to avoid double bookings.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleSave} disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </View>
    </View>
  );
}
