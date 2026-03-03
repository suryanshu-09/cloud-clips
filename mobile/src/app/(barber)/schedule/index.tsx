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
import type { Id } from '@convex/_generated/dataModel';
import { useAppointments } from '@/features/bookings/hooks/useAppointments';
import type { IAppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabType = 'calendar' | 'hours' | 'timeoff';

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
  hasTimeOff: boolean;
}

interface ITimeOffBlock {
  _id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  createdAt: number;
}

interface ITimeOffForm {
  startDate: string;
  endDate: string;
  reason: string;
  isPartialDay: boolean;
  startTime: string;
  endTime: string;
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

const EMPTY_TIME_OFF_FORM: ITimeOffForm = {
  startDate: '',
  endDate: '',
  reason: '',
  isPartialDay: false,
  startTime: '09:00',
  endTime: '17:00',
};

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

function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Convert a local Date to a "YYYY-MM-DD" string (local time zone) */
function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Format "YYYY-MM-DD" to "MMM D, YYYY" for display */
function formatDateDisplay(dateStr: string): string {
  if (!isValidDateFormat(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** Format "HH:mm" to "h:mm AM/PM" */
function formatTimeDisplay(time: string): string {
  if (!isValidTimeFormat(time)) return time;
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Check whether a calendar date string falls within a time-off block */
function dateStringInBlock(dateStr: string, block: ITimeOffBlock): boolean {
  return dateStr >= block.startDate && dateStr <= block.endDate;
}

// ---------------------------------------------------------------------------
// Calendar Grid Builder
// ---------------------------------------------------------------------------

function buildCalendarGrid(
  year: number,
  month: number,
  selectedDate: Date,
  today: Date,
  appointmentDates: Set<string>,
  timeOffDates: Set<string>
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
    const dateStr = toDateString(new Date(prevYear, prevMonth, day));
    days.push({
      date: day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasAppointments: appointmentDates.has(dateKey),
      hasTimeOff: timeOffDates.has(dateStr),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const thisDate = new Date(year, month, day);
    const dateStr = toDateString(thisDate);
    days.push({
      date: day,
      month,
      year,
      isCurrentMonth: true,
      isToday: isSameDay(thisDate, today),
      isSelected: isSameDay(thisDate, selectedDate),
      hasAppointments: appointmentDates.has(dateKey),
      hasTimeOff: timeOffDates.has(dateStr),
    });
  }

  // Next month filler days to complete the grid (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let day = 1; day <= remaining; day++) {
    const dateKey = `${nextYear}-${nextMonth}-${day}`;
    const dateStr = toDateString(new Date(nextYear, nextMonth, day));
    days.push({
      date: day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasAppointments: appointmentDates.has(dateKey),
      hasTimeOff: timeOffDates.has(dateStr),
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

  // Time-off state
  const [showAddTimeOff, setShowAddTimeOff] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState<ITimeOffForm>(EMPTY_TIME_OFF_FORM);
  const [isAddingTimeOff, setIsAddingTimeOff] = useState(false);

  // ------ Data ------
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const barberProfile = useQuery(api.barbers.queries.getBarberProfile);
  const updateWorkingHoursMutation = useMutation(api.barbers.mutations.updateWorkingHours);

  const timeOffBlocks = useQuery(api.timeOff.queries.getMyTimeOffBlocks, {}) as
    | ITimeOffBlock[]
    | undefined;
  const blockTimeOffMutation = useMutation(api.timeOff.mutations.blockTimeOff);
  const deleteTimeOffMutation = useMutation(api.timeOff.mutations.deleteTimeOffBlock);

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

  // ------ Build time-off dates set for calendar indicators ------
  const timeOffDates = useMemo(() => {
    const dates = new Set<string>();
    if (!timeOffBlocks) return dates;
    for (const block of timeOffBlocks) {
      // Enumerate all dates in the block range
      const start = new Date(block.startDate + 'T00:00:00');
      const end = new Date(block.endDate + 'T00:00:00');
      const cursor = new Date(start);
      while (cursor <= end) {
        dates.add(toDateString(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return dates;
  }, [timeOffBlocks]);

  // ------ Build calendar grid ------
  const calendarDays = useMemo(
    () =>
      buildCalendarGrid(
        currentYear,
        currentMonth,
        selectedDate,
        today,
        appointmentDates,
        timeOffDates
      ),
    [currentYear, currentMonth, selectedDate, today, appointmentDates, timeOffDates]
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

  // ------ Time-off blocks for selected date ------
  const selectedDayTimeOffBlocks = useMemo(() => {
    if (!timeOffBlocks) return [];
    const dateStr = toDateString(selectedDate);
    return timeOffBlocks.filter((b) => dateStringInBlock(dateStr, b));
  }, [timeOffBlocks, selectedDate]);

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

  /** Copy time from one day to all enabled days */
  const handleCopyTimeToAll = useCallback(
    (sourceDayOfWeek: number) => {
      const source = workingHours.find((h) => h.dayOfWeek === sourceDayOfWeek);
      if (!source || !source.isAvailable) return;
      setWorkingHours((prev) =>
        prev.map((h) =>
          h.isAvailable && h.dayOfWeek !== sourceDayOfWeek
            ? { ...h, startTime: source.startTime, endTime: source.endTime }
            : h
        )
      );
      setHasChanges(true);
      Alert.alert(
        'Hours Copied',
        `${source.startTime}–${source.endTime} applied to all available days.`
      );
    },
    [workingHours]
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

  // ------ Time-off handlers ------
  const handleTimeOffFormChange = useCallback(
    (field: keyof ITimeOffForm, value: string | boolean) => {
      setTimeOffForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddTimeOff = useCallback(async () => {
    // Validate
    if (!isValidDateFormat(timeOffForm.startDate)) {
      Alert.alert('Validation Error', 'Enter a valid start date (YYYY-MM-DD).');
      return;
    }
    if (!isValidDateFormat(timeOffForm.endDate)) {
      Alert.alert('Validation Error', 'Enter a valid end date (YYYY-MM-DD).');
      return;
    }
    if (timeOffForm.startDate > timeOffForm.endDate) {
      Alert.alert('Validation Error', 'Start date must be on or before end date.');
      return;
    }
    if (timeOffForm.isPartialDay) {
      if (!isValidTimeFormat(timeOffForm.startTime)) {
        Alert.alert('Validation Error', 'Enter a valid start time (HH:mm).');
        return;
      }
      if (!isValidTimeFormat(timeOffForm.endTime)) {
        Alert.alert('Validation Error', 'Enter a valid end time (HH:mm).');
        return;
      }
      if (timeToMinutes(timeOffForm.endTime) <= timeToMinutes(timeOffForm.startTime)) {
        Alert.alert('Validation Error', 'End time must be after start time.');
        return;
      }
      if (timeOffForm.startDate !== timeOffForm.endDate) {
        Alert.alert(
          'Validation Error',
          'Partial-day blocks must be a single day (start date must equal end date).'
        );
        return;
      }
    }

    setIsAddingTimeOff(true);
    try {
      await blockTimeOffMutation({
        startDate: timeOffForm.startDate,
        endDate: timeOffForm.endDate,
        reason: timeOffForm.reason || undefined,
        startTime: timeOffForm.isPartialDay ? timeOffForm.startTime : undefined,
        endTime: timeOffForm.isPartialDay ? timeOffForm.endTime : undefined,
      });
      setTimeOffForm(EMPTY_TIME_OFF_FORM);
      setShowAddTimeOff(false);
      Alert.alert('Success', 'Time off has been blocked.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add time off. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsAddingTimeOff(false);
    }
  }, [timeOffForm, blockTimeOffMutation]);

  const handleDeleteTimeOff = useCallback(
    (blockId: string, label: string) => {
      Alert.alert('Remove Time Off', `Remove "${label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimeOffMutation({ blockId: blockId as Id<'timeOffBlocks'> });
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Failed to remove time off.';
              Alert.alert('Error', message);
            }
          },
        },
      ]);
    },
    [deleteTimeOffMutation]
  );

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
          <View className="flex-row gap-0.5 mt-0.5 h-1.5">
            {day.hasAppointments && (
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  day.isSelected ? 'bg-white' : 'bg-blue-600'
                }`}
              />
            )}
            {day.hasTimeOff && (
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  day.isSelected ? 'bg-orange-200' : 'bg-orange-400'
                }`}
              />
            )}
          </View>
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

        {/* Legend */}
        <View className="flex-row gap-4 mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-blue-600" />
            <Text className="text-xs text-gray-500">Appointment</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-orange-400" />
            <Text className="text-xs text-gray-500">Time off</Text>
          </View>
        </View>
      </View>

      {/* Selected day time-off notice */}
      {selectedDayTimeOffBlocks.length > 0 && (
        <View className="mx-4 mt-3">
          {selectedDayTimeOffBlocks.map((block) => (
            <View
              key={block._id}
              className="bg-orange-50 rounded-xl p-3 mb-2 border border-orange-200 flex-row items-center gap-2"
            >
              <Ionicons name="moon-outline" size={16} color="#EA580C" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-orange-800">
                  {block.reason || 'Time Off'}
                </Text>
                {block.startTime && block.endTime ? (
                  <Text className="text-xs text-orange-600">
                    {formatTimeDisplay(block.startTime)} – {formatTimeDisplay(block.endTime)}
                  </Text>
                ) : (
                  <Text className="text-xs text-orange-600">All day</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

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
          {/* Info note */}
          <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-start gap-2">
              <Ionicons name="refresh-circle-outline" size={18} color="#2563EB" />
              <Text className="text-sm text-gray-700 flex-1">
                Working hours repeat every week. Set your recurring availability below. For one-off
                days off, use the{' '}
                <Text className="font-semibold text-blue-600">Time Off</Text> tab.
              </Text>
            </View>
          </View>

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
                <>
                  <View className="flex-row items-center gap-2 mt-1">
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center text-sm text-gray-700 border border-gray-200"
                      value={entry.startTime}
                      onChangeText={(val) => handleTimeChange(entry.dayOfWeek, 'startTime', val)}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <Text className="text-gray-400 font-medium">–</Text>
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center text-sm text-gray-700 border border-gray-200"
                      value={entry.endTime}
                      onChangeText={(val) => handleTimeChange(entry.dayOfWeek, 'endTime', val)}
                      placeholder="17:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                  {/* Copy to all available days */}
                  <Pressable
                    onPress={() => handleCopyTimeToAll(entry.dayOfWeek)}
                    className="mt-2 flex-row items-center gap-1"
                  >
                    <Ionicons name="copy-outline" size={13} color="#6B7280" />
                    <Text className="text-xs text-gray-400">Copy to all available days</Text>
                  </Pressable>
                </>
              )}

              {!entry.isAvailable && (
                <Text className="text-sm text-gray-400 italic">Unavailable</Text>
              )}
            </View>
          ))}

          {/* Format hint */}
          <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-start gap-2">
              <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-500 flex-1">
                Use HH:mm format (e.g. 09:00, 17:30). End time must be after start time.
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

  // ------ Time Off Section ------

  const renderTimeOffSection = () => (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Explainer */}
          <View className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <View className="flex-row items-start gap-2">
              <Ionicons name="moon-outline" size={18} color="#EA580C" />
              <Text className="text-sm text-gray-700 flex-1">
                Block specific dates when you will not be accepting appointments. Blocked dates will
                show no availability to clients.
              </Text>
            </View>
          </View>

          {/* Add new block button */}
          {!showAddTimeOff && (
            <Pressable
              onPress={() => setShowAddTimeOff(true)}
              className="bg-blue-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base">Block Time Off</Text>
            </Pressable>
          )}

          {/* Add time off form */}
          {showAddTimeOff && (
            <View className="bg-white rounded-xl p-4 border border-gray-200 gap-4">
              <Text className="text-base font-bold text-gray-900">New Time Off Block</Text>

              {/* Start Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Start Date <Text className="text-gray-400 font-normal">(YYYY-MM-DD)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-700 border border-gray-200"
                  value={timeOffForm.startDate}
                  onChangeText={(val) => handleTimeOffFormChange('startDate', val)}
                  placeholder="2026-03-15"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>

              {/* End Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  End Date <Text className="text-gray-400 font-normal">(YYYY-MM-DD)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-700 border border-gray-200"
                  value={timeOffForm.endDate}
                  onChangeText={(val) => handleTimeOffFormChange('endDate', val)}
                  placeholder="2026-03-17"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                <Text className="text-xs text-gray-400 mt-1">
                  For a single day, enter the same date in both fields.
                </Text>
              </View>

              {/* Reason */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Reason <Text className="text-gray-400 font-normal">(optional)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-700 border border-gray-200"
                  value={timeOffForm.reason}
                  onChangeText={(val) => handleTimeOffFormChange('reason', val)}
                  placeholder="Vacation, personal day…"
                  maxLength={100}
                />
              </View>

              {/* Partial day toggle */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-sm font-medium text-gray-700">Partial Day</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    Only block specific hours (single day only)
                  </Text>
                </View>
                <Switch
                  value={timeOffForm.isPartialDay}
                  onValueChange={(val) => handleTimeOffFormChange('isPartialDay', val)}
                  trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Partial-day time inputs */}
              {timeOffForm.isPartialDay && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1.5">Time Range</Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center text-sm text-gray-700 border border-gray-200"
                      value={timeOffForm.startTime}
                      onChangeText={(val) => handleTimeOffFormChange('startTime', val)}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <Text className="text-gray-400 font-medium">–</Text>
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-center text-sm text-gray-700 border border-gray-200"
                      value={timeOffForm.endTime}
                      onChangeText={(val) => handleTimeOffFormChange('endTime', val)}
                      placeholder="17:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                </View>
              )}

              {/* Form actions */}
              <View className="flex-row gap-3 pt-1">
                <Pressable
                  onPress={() => {
                    setShowAddTimeOff(false);
                    setTimeOffForm(EMPTY_TIME_OFF_FORM);
                  }}
                  className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
                  disabled={isAddingTimeOff}
                >
                  <Text className="text-gray-600 font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddTimeOff}
                  disabled={isAddingTimeOff}
                  className={`flex-1 rounded-xl py-3 items-center ${
                    isAddingTimeOff ? 'bg-blue-300' : 'bg-blue-600'
                  }`}
                >
                  {isAddingTimeOff ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-semibold">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Existing time-off blocks */}
          <Text className="text-base font-semibold text-gray-900">Upcoming Time Off</Text>

          {timeOffBlocks === undefined ? (
            <View className="items-center py-6">
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : timeOffBlocks.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center border border-gray-100">
              <Ionicons name="sunny-outline" size={40} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2 text-sm text-center">
                No time off blocks yet.{'\n'}Block dates when you are unavailable.
              </Text>
            </View>
          ) : (
            timeOffBlocks.map((block) => {
              const isSingleDay = block.startDate === block.endDate;
              const dateLabel = isSingleDay
                ? formatDateDisplay(block.startDate)
                : `${formatDateDisplay(block.startDate)} – ${formatDateDisplay(block.endDate)}`;
              const timeLabel =
                block.startTime && block.endTime
                  ? `${formatTimeDisplay(block.startTime)} – ${formatTimeDisplay(block.endTime)}`
                  : 'All day';

              return (
                <View
                  key={block._id}
                  className="bg-white rounded-xl p-4 border border-gray-100 flex-row items-center gap-3"
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                    <Ionicons name="moon-outline" size={20} color="#EA580C" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {block.reason || 'Time Off'}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{dateLabel}</Text>
                    <Text className="text-xs text-gray-400">{timeLabel}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      handleDeleteTimeOff(block._id, block.reason || dateLabel)
                    }
                    hitSlop={8}
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );

  // ------ Main render ------

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Schedule</Text>
        <Text className="text-gray-600">View appointments & manage availability</Text>
      </View>

      {/* Tab switcher */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {(
            [
              { key: 'calendar', icon: 'calendar', label: 'Calendar' },
              { key: 'hours', icon: 'time', label: 'Hours' },
              { key: 'timeoff', icon: 'moon', label: 'Time Off' },
            ] as const
          ).map(({ key, icon, label }) => (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-md items-center ${
                activeTab === key ? 'bg-white shadow-sm' : ''
              }`}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name={icon}
                  size={14}
                  color={activeTab === key ? '#2563EB' : '#6B7280'}
                />
                <Text
                  className={`text-xs font-medium ${
                    activeTab === key ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'calendar' && renderCalendarSection()}
      {activeTab === 'hours' && renderWorkingHoursSection()}
      {activeTab === 'timeoff' && renderTimeOffSection()}
    </View>
  );
}
