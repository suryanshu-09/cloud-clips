import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';

import { api } from '@convex/_generated/api';
import { useAppointments } from '@/features/bookings/hooks/useAppointments';
import type { IAppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabType = 'calendar' | 'hours';

interface IWorkingHourEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ICalendarDay {
  date: number; // day of month
  month: number; // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasAppointments: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
  in_progress: { bg: 'bg-green-100', text: 'text-green-700', label: 'In Progress' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  no_show: { bg: 'bg-red-200', text: 'text-red-900', label: 'No Show' },
};

const DEFAULT_WORKING_HOURS: IWorkingHourEntry[] = [
  { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isAvailable: false },
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isAvailable: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// ---------------------------------------------------------------------------
// Calendar Grid Builder
// ---------------------------------------------------------------------------

function buildCalendarGrid(
  year: number,
  month: number,
  selectedDate: Date,
  today: Date,
  appointmentDates: Set<string>
): ICalendarDay[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days: ICalendarDay[] = [];

  // Previous month filler days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateKey = `${prevYear}-${prevMonth}-${day}`;
    days.push({
      date: day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasAppointments: appointmentDates.has(dateKey),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const thisDate = new Date(year, month, day);
    days.push({
      date: day,
      month,
      year,
      isCurrentMonth: true,
      isToday: isSameDay(thisDate, today),
      isSelected: isSameDay(thisDate, selectedDate),
      hasAppointments: appointmentDates.has(dateKey),
    });
  }

  // Next month filler days to complete the grid (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let day = 1; day <= remaining; day++) {
    const dateKey = `${nextYear}-${nextMonth}-${day}`;
    days.push({
      date: day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasAppointments: appointmentDates.has(dateKey),
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ScheduleScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  // ------ State ------
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);

  // Working hours state
  const [workingHours, setWorkingHours] = useState<IWorkingHourEntry[]>(DEFAULT_WORKING_HOURS);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ------ Data ------
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const barberProfile = useQuery(api.barbers.queries.getBarberProfile);
  const updateWorkingHoursMutation = useMutation(api.barbers.mutations.updateWorkingHours);

  // ------ Initialize working hours from profile ------
  useEffect(() => {
    if (barberProfile?.workingHours && !hasInitialized) {
      const profileHours = barberProfile.workingHours as IWorkingHourEntry[];
      // Ensure all 7 days are present
      const normalized: IWorkingHourEntry[] = WEEKDAY_NAMES.map((_, index) => {
        const existing = profileHours.find((h) => h.dayOfWeek === index);
        return existing ?? DEFAULT_WORKING_HOURS[index];
      });
      setWorkingHours(normalized);
      setHasInitialized(true);
    }
  }, [barberProfile, hasInitialized]);

  // ------ Build appointment dates set for dot indicators ------
  const appointmentDates = useMemo(() => {
    const dates = new Set<string>();
    for (const apt of appointments) {
      const d = new Date(apt.scheduledFor);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return dates;
  }, [appointments]);

  // ------ Build calendar grid ------
  const calendarDays = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth, selectedDate, today, appointmentDates),
    [currentYear, currentMonth, selectedDate, today, appointmentDates]
  );

  // ------ Filter appointments for selected date ------
  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.scheduledFor);
        return isSameDay(aptDate, selectedDate);
      })
      .sort((a, b) => a.scheduledFor - b.scheduledFor);
  }, [appointments, selectedDate]);

  // ------ Calendar navigation ------
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleDayPress = useCallback((day: ICalendarDay) => {
    setSelectedDate(new Date(day.year, day.month, day.date));
    // If the day is from a different month, navigate to that month
    if (!day.isCurrentMonth) {
      setCurrentMonth(day.month);
      setCurrentYear(day.year);
    }
  }, []);

  const handleAppointmentPress = useCallback(
    (id: string) => {
      router.push(`/(barber)/appointments/${id}`);
    },
    [router]
  );

  // ------ Working hours handlers ------
  const handleToggleDay = useCallback((dayOfWeek: number) => {
    setWorkingHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, isAvailable: !h.isAvailable } : h))
    );
    setHasChanges(true);
  }, []);

  const handleTimeChange = useCallback(
    (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
      setWorkingHours((prev) =>
        prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
      );
      setHasChanges(true);
    },
    []
  );

  const validateWorkingHours = useCallback((): string | null => {
    for (const h of workingHours) {
      if (!h.isAvailable) continue;

      if (!isValidTimeFormat(h.startTime)) {
        return `${WEEKDAY_NAMES[h.dayOfWeek]}: Invalid start time format (use HH:mm)`;
      }
      if (!isValidTimeFormat(h.endTime)) {
        return `${WEEKDAY_NAMES[h.dayOfWeek]}: Invalid end time format (use HH:mm)`;
      }
      if (timeToMinutes(h.endTime) <= timeToMinutes(h.startTime)) {
        return `${WEEKDAY_NAMES[h.dayOfWeek]}: End time must be after start time`;
      }
    }
    return null;
  }, [workingHours]);

  const handleSaveWorkingHours = useCallback(async () => {
    const validationError = validateWorkingHours();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateWorkingHoursMutation({ workingHours });
      setHasChanges(false);
      Alert.alert('Success', 'Your working hours have been updated.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save working hours. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  }, [workingHours, updateWorkingHoursMutation, validateWorkingHours]);

  // ------ Render helpers ------

  const renderCalendarDay = useCallback(
    (day: ICalendarDay, index: number) => {
      const bgClass = day.isSelected ? 'bg-blue-600' : day.isToday ? 'bg-blue-100' : '';

      const textClass = day.isSelected
        ? 'text-white font-bold'
        : day.isToday
          ? 'text-blue-600 font-bold'
          : day.isCurrentMonth
            ? 'text-gray-900'
            : 'text-gray-300';

      return (
        <Pressable
          key={index}
          onPress={() => handleDayPress(day)}
          className={`items-center justify-center py-2 rounded-full ${bgClass}`}
          style={{ width: '14.28%' }}
        >
          <Text className={`text-sm ${textClass}`}>{day.date}</Text>
          {day.hasAppointments && (
            <View
              className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                day.isSelected ? 'bg-white' : 'bg-blue-600'
              }`}
            />
          )}
        </Pressable>
      );
    },
    [handleDayPress]
  );

  const renderAppointmentItem = useCallback(
    ({ item }: { item: IAppointmentWithDetails }) => {
      const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
      return (
        <Pressable
          onPress={() => handleAppointmentPress(item._id)}
          className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {item.clientName || 'Client'}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${status.bg}`}>
              <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
            </View>
          </View>
          <Text className="text-sm text-gray-600 mb-1">{item.serviceName}</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500">
              {formatTime(item.scheduledFor)}
              {item.endTime ? ` - ${formatTime(item.endTime)}` : ''}
            </Text>
          </View>
        </Pressable>
      );
    },
    [handleAppointmentPress]
  );

  const appointmentKeyExtractor = useCallback((item: IAppointmentWithDetails) => item._id, []);

  // ------ Calendar Section ------

  const renderCalendarSection = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Month navigation */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={goToPrevMonth} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <Pressable onPress={goToNextMonth} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Day-of-week headers */}
        <View className="flex-row mb-2">
          {DAY_HEADERS.map((label, i) => (
            <View key={i} className="items-center" style={{ width: '14.28%' }}>
              <Text className="text-xs font-semibold text-gray-400">{label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="flex-row flex-wrap">
          {calendarDays.map((day, index) => renderCalendarDay(day, index))}
        </View>
      </View>

      {/* Selected day appointments */}
      <View className="px-4 mt-4 pb-6">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          {isSameDay(selectedDate, today)
            ? "Today's Appointments"
            : `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()} Appointments`}
        </Text>

        {appointmentsLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : selectedDayAppointments.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center border border-gray-100">
            <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2 text-sm">No appointments for this day</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDayAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={appointmentKeyExtractor}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );

  // ------ Working Hours Section ------

  const renderWorkingHoursSection = () => (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-3">
          {workingHours.map((entry) => (
            <View key={entry.dayOfWeek} className="bg-white rounded-xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-gray-900">
                  {WEEKDAY_NAMES[entry.dayOfWeek]}
                </Text>
                <Switch
                  value={entry.isAvailable}
                  onValueChange={() => handleToggleDay(entry.dayOfWeek)}
                  trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                  thumbColor={entry.isAvailable ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              {entry.isAvailable && (
                <View className="flex-row items-center gap-2 mt-1">
                  <TextInput
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center text-sm text-gray-700 border border-gray-200"
                    value={entry.startTime}
                    onChangeText={(val) => handleTimeChange(entry.dayOfWeek, 'startTime', val)}
                    placeholder="09:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  <Text className="text-gray-400 font-medium">-</Text>
                  <TextInput
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center text-sm text-gray-700 border border-gray-200"
                    value={entry.endTime}
                    onChangeText={(val) => handleTimeChange(entry.dayOfWeek, 'endTime', val)}
                    placeholder="17:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              )}

              {!entry.isAvailable && (
                <Text className="text-sm text-gray-400 italic">Unavailable</Text>
              )}
            </View>
          ))}

          {/* Info note */}
          <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-start gap-2">
              <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
              <Text className="text-sm text-gray-700 flex-1">
                Use HH:mm format (e.g. 09:00, 17:30). End time must be after start time. Changes are
                saved when you press the button below.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={handleSaveWorkingHours}
          disabled={!hasChanges || isSaving}
          className={`rounded-xl py-4 items-center ${
            hasChanges && !isSaving ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-base font-semibold ${hasChanges ? 'text-white' : 'text-gray-500'}`}
            >
              Save Changes
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  // ------ Main render ------

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Schedule</Text>
        <Text className="text-gray-600">View appointments & manage hours</Text>
      </View>

      {/* Tab switcher */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          <Pressable
            onPress={() => setActiveTab('calendar')}
            className={`flex-1 py-2 rounded-md items-center ${
              activeTab === 'calendar' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="calendar"
                size={16}
                color={activeTab === 'calendar' ? '#2563EB' : '#6B7280'}
              />
              <Text
                className={`text-sm font-medium ${
                  activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                Calendar
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('hours')}
            className={`flex-1 py-2 rounded-md items-center ${
              activeTab === 'hours' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="time"
                size={16}
                color={activeTab === 'hours' ? '#2563EB' : '#6B7280'}
              />
              <Text
                className={`text-sm font-medium ${
                  activeTab === 'hours' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                Working Hours
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'calendar' ? renderCalendarSection() : renderWorkingHoursSection()}
    </View>
  );
}
